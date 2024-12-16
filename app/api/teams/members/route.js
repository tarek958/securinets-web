import { NextResponse } from 'next/server';
import { connectToDatabase as connectToDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { getIO } from '@/lib/socket';

export async function DELETE(request) {
  try {
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    const { teamId, memberId, action } = await request.json();

    if (!teamId || !memberId || !action) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    if (!['remove', 'leave'].includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid action'
      }, { status: 400 });
    }

    const { db } = await connectToDb();

    // Get team information
    const team = await db.collection('teams').findOne({
      _id: new ObjectId(teamId)
    });

    if (!team) {
      return NextResponse.json({
        success: false,
        message: 'Team not found'
      }, { status: 404 });
    }

    const userId = user.sub || user._id || user.id;
    console.log('User check:', {
      userId,
      teamLeaderId: team.leaderId,
      isLeader: team.leaderId === userId
    });

    // For 'remove' action, verify the requester is the team leader
    if (action === 'remove' && team.leaderId !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Only team leader can remove members'
      }, { status: 403 });
    }

    // For 'leave' action, verify the requester is the member leaving
    if (action === 'leave' && userId !== memberId) {
      return NextResponse.json({
        success: false,
        message: 'You can only remove yourself'
      }, { status: 403 });
    }

    // Cannot remove team leader
    if (memberId === team.leaderId) {
      return NextResponse.json({
        success: false,
        message: 'Cannot remove team leader'
      }, { status: 403 });
    }

    // Update team members
    const result = await db.collection('teams').updateOne(
      { _id: new ObjectId(teamId) },
      { $pull: { members: memberId } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update team'
      }, { status: 500 });
    }

    // If user is leaving, update their team reference
    if (action === 'leave') {
      await db.collection('users').updateOne(
        { _id: new ObjectId(memberId) },
        { $unset: { teamId: "" } }
      );
    }

    // Notify other team members
    const io = getIO();
    if (io) {
      io.to(`team:${teamId}`).emit('team:update', {
        type: action === 'leave' ? 'member_left' : 'member_removed',
        memberId
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in team members API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
