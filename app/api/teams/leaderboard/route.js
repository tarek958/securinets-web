import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();

    // Get all teams first
    const teams = await db.collection('teams')
      .find({})
      .project({
        _id: 1,
        name: 1,
        leaderId: 1,
        members: 1,
        createdAt: 1
      })
      .toArray();

    // Get solves for all teams
    const teamSolves = await db.collection('solves')
      .aggregate([
        {
          $match: {
            teamId: { 
              $in: teams.map(team => team._id.toString())
            }
          }
        },
        {
          $group: {
            _id: '$teamId',
            totalPoints: { $sum: '$points' },
            uniqueChallenges: { $addToSet: '$challengeId' }
          }
        }
      ])
      .toArray();

    // Create a map of team solves
    const teamSolvesMap = teamSolves.reduce((map, solve) => {
      map[solve._id] = {
        points: solve.totalPoints,
        challengesCount: solve.uniqueChallenges.length
      };
      return map;
    }, {});

    // Combine team data with their solves
    const teamsWithStats = teams.map(team => ({
      _id: team._id.toString(),
      name: team.name,
      members: team.members,
      totalPoints: teamSolvesMap[team._id.toString()]?.points || 0,
      solvedCount: teamSolvesMap[team._id.toString()]?.challengesCount || 0
    }));

    // Sort teams by points (descending)
    teamsWithStats.sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json(teamsWithStats);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
