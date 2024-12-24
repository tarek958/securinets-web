import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
export const dynamic = 'force-dynamic';

export async function PUT(request) {
  try {
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    const { db } = await connectToDatabase();
    const { teamId, name } = await request.json();

    // Get the team
    const team = await db.collection('teams').findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      return Response.json({ success: false, message: 'Team not found' }, { status: 404 });
    }

    // Check if user is team leader
    const userId = user.sub || user._id || user.id;
    if (team.leaderId.toString() !== userId.toString()) {
      return Response.json({ success: false, message: 'Only team leader can update team' }, { status: 403 });
    }

    // Update team name
    await db.collection('teams').updateOne(
      { _id: new ObjectId(teamId) },
      { $set: { name: name } }
    );

    const updatedTeam = await db.collection('teams').findOne({ _id: new ObjectId(teamId) });
    return Response.json({ success: true, team: updatedTeam });
  } catch (error) {
    console.error('Error updating team:', error);
    return Response.json({ success: false, message: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    const { db } = await connectToDatabase();
    const { teamId } = await request.json();

    // Get the team
    const team = await db.collection('teams').findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      return Response.json({ success: false, message: 'Team not found' }, { status: 404 });
    }

    // Check if user is team leader
    const userId = user.sub || user._id || user.id;
    if (team.leaderId.toString() !== userId.toString()) {
      return Response.json({ success: false, message: 'Only team leader can delete team' }, { status: 403 });
    }

    // Delete team
    await db.collection('teams').deleteOne({ _id: new ObjectId(teamId) });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return Response.json({ success: false, message: 'Failed to delete team' }, { status: 500 });
  }
}
