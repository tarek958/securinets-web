import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(request) {
  try {
    const { db } = await connectToDatabase();
    
    // Delete all documents from the sessions collection
    const result = await db.collection("sessions").deleteMany({});
    
    console.log('Cleared sessions collection. Deleted count:', result.deletedCount);
    
    return NextResponse.json({
      message: "All sessions cleared successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return NextResponse.json(
      { error: "Failed to clear sessions" },
      { status: 500 }
    );
  }
}
