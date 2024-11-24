import { connectToDatabase } from '@/lib/db';
import Challenge from '@/models/Challenge';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Users only see active challenges
    const challenges = await db.collection('challenges')
      .find({ status: 'active' })
      .project({ flag: 0 }) // Exclude flag field
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(challenges);
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
    const data = await request.json();
    const { db } = await connectToDatabase();

    // Create new challenge
    const challenge = new Challenge({
      ...data,
      isActive: true,
    });

    await challenge.save();

    // Return the challenge without the flag
    const { flag, ...challengeWithoutFlag } = challenge.toObject();
    return NextResponse.json(challengeWithoutFlag);
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}
