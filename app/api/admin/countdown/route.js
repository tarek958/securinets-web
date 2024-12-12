import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const countdown = await db.collection('countdown').findOne({});
    
    return NextResponse.json({ 
      countdown: countdown ? {
        ...countdown,
        targetDate: countdown.targetDate.toISOString()
      } : null 
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching countdown:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countdown' }, 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function POST(request) {
  try {
    const { targetDate } = await request.json();
    if (!targetDate) {
      return NextResponse.json(
        { error: 'Target date is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Delete existing countdown if any
    await db.collection('countdown').deleteMany({});
    
    // Create new countdown with validated date
    const newDate = new Date(targetDate);
    if (isNaN(newDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const result = await db.collection('countdown').insertOne({
      targetDate: newDate,
      createdAt: new Date()
    });
    
    const countdown = await db.collection('countdown').findOne({ _id: result.insertedId });
    
    return NextResponse.json({ 
      countdown: {
        ...countdown,
        targetDate: countdown.targetDate.toISOString()
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error setting countdown:', error);
    return NextResponse.json(
      { error: 'Failed to set countdown' }, 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
