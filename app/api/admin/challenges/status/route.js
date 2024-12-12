import { NextResponse } from "next/server";
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from "mongodb";

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

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Error updating challenge status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update challenge status" },
      { status: 500 }
    );
  }
}
