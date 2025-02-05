import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { broadcast } from '@/app/api/events/route';
import { ObjectId } from 'mongodb';
import { writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Helper function to save file
async function saveFile(file) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique filename
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const originalName = file.name;
    const extension = path.extname(originalName);
    const filename = `${uniqueId}${extension}`;
    
    // Save file to public/challenges directory
    const filePath = path.join(process.cwd(), 'public', 'challenges', filename);
    await writeFile(filePath, buffer);
    
    // Return the public URL
    return {
      filename,
      url: `/api/challenges/download/${filename}`,
      originalName,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const authResult = await verifyAuth(request);
    
    // Cache key based on auth status
    const cacheKey = `challenges_all_${authResult.user ? authResult.user._id : 'anonymous'}`;
    
    // Check Redis cache first
    const cachedData = await db.redis?.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    // Get all active challenges
    const challenges = await db.collection('challenges')
      .find({ status: 'active' })
      .project({ flag: 0 }) // Exclude flag field
      .sort({ createdAt: -1 })
      .toArray();

    // Get all solved entries for each challenge
    const solvedEntries = await db.collection('users')
      .aggregate([
        { $unwind: '$solvedChallenges' },
        {
          $group: {
            _id: '$solvedChallenges',
            count: { $sum: 1 },
            users: { $push: '$_id' }
          }
        }
      ]).toArray();

    // Create a map of challenge ID to solved info
    const solvedMap = solvedEntries.reduce((acc, entry) => {
      acc[entry._id] = {
        count: entry.count,
        users: entry.users
      };
      return acc;
    }, {});

    // Get teams information
    const teams = await db.collection('teams').find({}).toArray();
    const teamMap = teams.reduce((acc, team) => {
      const allMembers = [...new Set([...team.members, team.leaderId])];
      acc[team._id.toString()] = {
        name: team.name,
        members: allMembers
      };
      return acc;
    }, {});

    // Enhance challenges with solved information
    const enhancedChallenges = challenges.map(challenge => {
      const solvedInfo = solvedMap[challenge._id.toString()] || { count: 0, users: [] };
      
      // Find teams that solved this challenge
      const solvedTeams = teams.filter(team => {
        const allMembers = [...new Set([...team.members, team.leaderId])];
        return allMembers.some(memberId => 
          solvedInfo.users.some(userId => userId.toString() === memberId)
        );
      }).map(team => ({
        id: team._id,
        name: team.name
      }));

      // Process files to handle both old and new format
      const processedFiles = challenge.files?.map(file => {
        if (file.data) {
          // Old format (base64)
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            data: file.data,
            isBase64: true
          };
        } else {
          // New format (stored file)
          return {
            name: file.originalName,
            filename: file.filename,
            url: file.url,
            type: file.type,
            size: file.size,
            isBase64: false
          };
        }
      }) || [];

      return {
        ...challenge,
        solvedCount: solvedInfo.count,
        solvedTeams,
        files: processedFiles
      };
    });

    // If user is authenticated, get their solved challenges and team info
    if (authResult.user) {
      const userId = authResult.user._id;
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { solvedChallenges: 1 } }
      );

      if (user) {
        // Get user's team if they have one
        const team = await db.collection('teams').findOne({
          $or: [
            { leaderId: userId.toString() },
            { members: userId.toString() }
          ]
        });

        // If user is in a team, get all team members' solved challenges
        if (team) {
          // Mark challenges as solved if the current user has solved them
          enhancedChallenges.forEach(challenge => {
            const challengeId = challenge._id.toString();
            const userSolved = user.solvedChallenges?.includes(challengeId);
            
            // Check if user's team is in the challenge's solvedTeams array
            const teamSolved = challenge.solvedTeams?.some(solvedTeam => 
              solvedTeam.id === team._id.toString()
            );
            
            challenge.isSolved = userSolved;
            challenge.solvedByTeam = teamSolved || false;
          });
        } else {
          // No team, just mark user's solved challenges
          enhancedChallenges.forEach(challenge => {
            challenge.isSolved = user.solvedChallenges?.includes(challenge._id.toString());
            challenge.solvedByTeam = false; // Explicitly set to false when user has no team
          });
        }
      }
    }

    // Cache the result for 5 minutes
    if (db.redis) {
      await db.redis.setex(cacheKey, 300, JSON.stringify(enhancedChallenges));
    }

    return NextResponse.json(enhancedChallenges);

  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const authResult = await verifyAuth(request);

    if (!authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle multipart form data
    const formData = await request.formData();
    
    // Process challenge files
    const files = formData.getAll('files');
    const challengeFiles = [];
    
    if (files && files.length > 0) {
      for (const file of files) {
        if (file instanceof File) {
          const fileInfo = await saveFile(file);
          challengeFiles.push(fileInfo);
        }
      }
    }

    // Create the challenge document
    const challengeDoc = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      difficulty: formData.get('difficulty'),
      points: parseInt(formData.get('points')),
      flag: formData.get('flag'),
      createdAt: new Date(),
      status: 'active',
      createdBy: authResult.user._id,
      files: challengeFiles
    };

    // Validate required fields
    if (!challengeDoc.title || !challengeDoc.description || !challengeDoc.flag || 
        !challengeDoc.category || !challengeDoc.difficulty || !challengeDoc.points) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert the challenge
    const result = await db.collection('challenges').insertOne(challengeDoc);

    // Emit socket event for new challenge
    const io = request.socket.server.io;
    if (io) {
      const challengeNotification = {
        _id: result.insertedId,
        title: challengeDoc.title,
        category: challengeDoc.category,
        points: challengeDoc.points
      };
      io.emit('newChallenge', challengeNotification);
    }

    // Clear the cache
    await db.redis?.del('challenges_all_*');

    return NextResponse.json({ 
      success: true,
      message: 'Challenge created successfully',
      challengeId: result.insertedId
    });

  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}
