import { NextResponse } from "next/server";
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from "mongodb";
import { notifyNewChallenge } from '@/lib/socket';

export async function PATCH(req) {
  try {
    const userData = req.headers.get('x-user-data');
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

    const { challengeId, status } = await req.json();
    console.log('Received status update request:', { challengeId, status });

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: "Challenge ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // First, get the current challenge
    const challenge = await db.collection("challenges").findOne({
      _id: new ObjectId(challengeId)
    });

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: "Challenge not found" },
        { status: 404 }
      );
    }

    const newStatus = challenge.status === "active" ? "inactive" : "active";
    console.log('Updating challenge status from', challenge.status, 'to', newStatus);
    
    const result = await db.collection("challenges").findOneAndUpdate(
      { _id: new ObjectId(challengeId) },
      { $set: { status: newStatus } },
      { returnDocument: 'after' }
    );

    if (newStatus === 'active' && result.value) {
      console.log('Challenge activated, sending notification');
      try {
        notifyNewChallenge(result.value);
        console.log('Notification sent successfully');
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      status: newStatus,
      challenge: result.value 
    });
  } catch (error) {
    console.error("Error updating challenge status:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
