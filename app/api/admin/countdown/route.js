import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const countdown = await db.collection('countdown').findOne({});
    
    // Explicitly create NextResponse with JSON and headers
    return NextResponse.json(countdown || {}, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching countdown:', error);
    
    // Use NextResponse.json for error response
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
    const { db } = await connectToDatabase();
    
    // Delete existing countdown if any
    await db.collection('countdown').deleteMany({});
    
    // Create new countdown
    const result = await db.collection('countdown').insertOne({
      targetDate: new Date(targetDate)
    });
    
    const countdown = await db.collection('countdown').findOne({ _id: result.insertedId });
    
    // Use NextResponse.json for consistent response
    return NextResponse.json(countdown || {}, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error setting countdown:', error);
    
    // Use NextResponse.json for error response
    return NextResponse.json(
      { error: 'Failed to set countdown' }, 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
