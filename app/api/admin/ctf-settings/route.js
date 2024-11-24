import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const { startTime, endTime } = await request.json();

    // Validate input
    if (!startTime || !endTime) {
      return NextResponse.json({ 
        success: false, 
        message: 'Start time and end time are required' 
      }, { status: 400 });
    }

    // Convert to Date objects
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Validate dates
    if (endDate <= startDate) {
      return NextResponse.json({ 
        success: false, 
        message: 'End time must be after start time' 
      }, { status: 400 });
    }

    // Update or create CTF settings
    await db.collection('ctfSettings').updateOne(
      { type: 'timing' },
      { 
        $set: {
          startTime: startDate,
          endTime: endDate,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'CTF timing settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating CTF settings:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    const settings = await db.collection('ctfSettings').findOne({ type: 'timing' });
    
    if (!settings) {
      return NextResponse.json({ 
        success: false, 
        message: 'CTF timing settings not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        startTime: settings.startTime,
        endTime: settings.endTime
      }
    });

  } catch (error) {
    console.error('Error fetching CTF settings:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
