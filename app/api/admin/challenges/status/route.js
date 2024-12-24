import { NextResponse } from "next/server";
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from "mongodb";
import { broadcast } from '@/app/api/events/route';

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

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: "Challenge ID is required" },
        { status: 400 }
      );
    }

    const newStatus = status === "active" ? "inactive" : "active";

    const { db } = await connectToDatabase();

    // First get the challenge details
    const challenge = await db.collection("challenges").findOne(
      { _id: new ObjectId(challengeId) }
    );

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: "Challenge not found" },
        { status: 404 }
      );
    }

    const result = await db.collection("challenges").updateOne(
      { _id: new ObjectId(challengeId) },
      { $set: { status: newStatus } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Challenge not found" },
        { status: 404 }
      );
    }

    // If the challenge is being activated, send notification
    if (newStatus === "active") {
      await broadcast({
        type: 'challenge-notification',
        message: `New challenge available: ${challenge.title}!`,
        challenge: {
          id: challengeId,
          title: challenge.title,
          category: challenge.category,
          points: challenge.points
        }
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Error updating challenge status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update challenge status" },
      { status: 500 }
    );
  }
}
