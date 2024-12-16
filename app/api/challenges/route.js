import { connectToDatabase } from '@/lib/db';
import Challenge from '@/models/Challenge';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/auth';
import { getIO } from '@/lib/socket';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const authResult = await verifyAuth(request);
    
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

      return {
        ...challenge,
        solvedCount: solvedInfo.count,
        solvedTeams
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
          console.log('Found team:', {
            teamId: team._id.toString(),
            teamName: team.name,
            members: team.members,
            leaderId: team.leaderId
          });
          
          // Mark challenges as solved if the current user has solved them
          enhancedChallenges.forEach(challenge => {
            const challengeId = challenge._id.toString();
            const userSolved = user.solvedChallenges?.includes(challengeId);
            
            // Check if user's team is in the challenge's solvedTeams array
            const teamSolved = challenge.solvedTeams?.some(solvedTeam => {
              console.log('Comparing teams:', {
                solvedTeamId: solvedTeam.id,
                userTeamId: team._id.toString(),
                match: solvedTeam.id === team._id.toString()
              });
              return solvedTeam.id === team._id.toString();
            });
            
            console.log(`Challenge ${challenge.title} (${challengeId}):`, {
              userSolved,
              teamSolved,
              teamId: team._id.toString(),
              solvedTeams: challenge.solvedTeams,
              solvedTeamIds: challenge.solvedTeams?.map(t => t.id)
            });
            
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

    if (!authResult.success || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    
    // Log the received form data for debugging
    console.log('Received form data:', {
      title: formData.get('title'),
      category: formData.get('category'),
      status: formData.get('status')
    });

    // Create challenge data object
    const challengeData = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      difficulty: formData.get('difficulty'),
      points: parseInt(formData.get('points')),
      flag: formData.get('flag'),
      author: authResult.user._id,
      status: formData.get('status') || 'inactive', // Use form status or default to inactive
      hints: [],
      files: []
    };

    // Add hints if present
    const hintsData = formData.get('hints');
    if (hintsData) {
      const hints = JSON.parse(hintsData);
      challengeData.hints = hints.map(hint => ({ content: hint, cost: 0 }));
    }

    // Create and save the challenge
    const challenge = new Challenge(challengeData);
    await challenge.save();

    // Log the created challenge for debugging
    console.log('Created challenge:', {
      id: challenge._id,
      title: challenge.title,
      status: challenge.status
    });

    // Notify connected clients
    const io = getIO();
    if (io) {
      io.emit('challengeCreated', { 
        challengeId: challenge._id,
        status: challenge.status 
      });
    }

    return NextResponse.json({ 
      message: 'Challenge created successfully',
      status: challenge.status // Include status in response
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}
