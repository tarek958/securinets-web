import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
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
    
    // Return the file metadata
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

// GET all challenges (admin view)
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();

    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Admin sees all challenges regardless of status
    const challenges = await db.collection('challenges')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, challenges });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// POST create new challenge
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();

    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    
    // Process files if any
    const files = formData.getAll('files');
    const processedFiles = await Promise.all(
      files.map(file => saveFile(file))
    );

    const challenge = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      difficulty: formData.get('difficulty'),
      points: parseInt(formData.get('points')),
      flag: formData.get('flag'),
      hints: formData.getAll('hints[]').filter(hint => hint.trim()),
      files: processedFiles,
      status: formData.get('status') || 'inactive',
      createdAt: new Date(),
      createdBy: user._id,
      solvedBy: []
    };

    const result = await db.collection('challenges').insertOne(challenge);

    // Clear the challenges cache
    if (db.redis) {
      const keys = await db.redis.keys('challenges_all_*');
      if (keys.length > 0) {
        await db.redis.del(keys);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Challenge created successfully',
      challengeId: result.insertedId,
      files: processedFiles
    });

  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}
