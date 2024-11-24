import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const countdown = await db.collection('countdown').findOne({});
    return NextResponse.json({ countdown });
  } catch (error) {
    console.error('Error fetching countdown:', error);
    return NextResponse.json({ error: 'Failed to fetch countdown' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { targetDate } = await req.json();
    const { db } = await connectToDatabase();
    
    // Delete existing countdown if any
    await db.collection('countdown').deleteMany({});
    
    // Create new countdown
    const result = await db.collection('countdown').insertOne({
      targetDate: new Date(targetDate)
    });
    
    const countdown = await db.collection('countdown').findOne({ _id: result.insertedId });
    
    return NextResponse.json({ countdown });
  } catch (error) {
    console.error('Error setting countdown:', error);
    return NextResponse.json({ error: 'Failed to set countdown' }, { status: 500 });
  }
}
