import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();

    // Get total users count
    const totalUsers = await db.collection('users').countDocuments();

    // Get total teams count
    const totalTeams = await db.collection('teams').countDocuments();

    // Get challenges statistics
    const challengeStats = await db.collection('challenges')
      .aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalPoints: { $sum: '$points' },
            avgPoints: { $avg: '$points' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
      .toArray();

    // Get solve statistics by category
    const solveStats = await db.collection('solves')
      .aggregate([
        {
          $lookup: {
            from: 'challenges',
            let: { challengeId: '$challengeId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$challengeId' }]
                  }
                }
              }
            ],
            as: 'challenge'
          }
        },
        {
          $unwind: '$challenge'
        },
        {
          $group: {
            _id: '$challenge.category',
            solveCount: { $sum: 1 },
            uniqueTeams: { $addToSet: '$teamId' }
          }
        },
        {
          $project: {
            solveCount: 1,
            uniqueTeamCount: { $size: '$uniqueTeams' }
          }
        },
        {
          $sort: { solveCount: -1 }
        }
      ])
      .toArray();

    // Get most solved challenges
    const mostSolvedChallenges = await db.collection('solves')
      .aggregate([
        {
          $group: {
            _id: '$challengeId',
            solveCount: { $sum: 1 },
            uniqueTeams: { $addToSet: '$teamId' }
          }
        },
        {
          $sort: { solveCount: -1 }
        },
        {
          $limit: 5
        },
        {
          $lookup: {
            from: 'challenges',
            let: { challengeId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$challengeId' }]
                  }
                }
              }
            ],
            as: 'challenge'
          }
        },
        {
          $unwind: '$challenge'
        },
        {
          $project: {
            _id: 1,
            name: '$challenge.name',
            category: '$challenge.category',
            points: '$challenge.points',
            solveCount: 1,
            uniqueTeamCount: { $size: '$uniqueTeams' }
          }
        }
      ])
      .toArray();

    // Get solve time distribution (last 24 hours)
    const solveTimeDistribution = await db.collection('solves')
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              hour: { $hour: { $toDate: '$timestamp' } }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.hour': 1 }
        }
      ])
      .toArray();

    // Fill in missing hours with zero counts
    const hourlyData = new Array(24).fill(0).map((_, i) => ({
      _id: { hour: i },
      count: 0
    }));
    
    solveTimeDistribution.forEach(data => {
      hourlyData[data._id.hour].count = data.count;
    });

    // Get team size distribution
    const teamSizeDistribution = await db.collection('teams')
      .aggregate([
        {
          $project: {
            memberCount: { $size: '$members' }
          }
        },
        {
          $group: {
            _id: '$memberCount',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])
      .toArray();

    // Get difficulty distribution
    const difficultyDistribution = await db.collection('challenges')
      .aggregate([
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 },
            totalPoints: { $sum: '$points' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])
      .toArray();

    // Get first blood statistics
    const firstBloods = await db.collection('solves')
      .aggregate([
        {
          $sort: { timestamp: 1 }
        },
        {
          $group: {
            _id: '$challengeId',
            firstSolve: { $first: '$$ROOT' }
          }
        },
        {
          $lookup: {
            from: 'challenges',
            let: { challengeId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$challengeId' }]
                  }
                }
              }
            ],
            as: 'challenge'
          }
        },
        {
          $lookup: {
            from: 'teams',
            let: { teamId: '$firstSolve.teamId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$teamId' }]
                  }
                }
              }
            ],
            as: 'team'
          }
        },
        {
          $unwind: '$challenge'
        },
        {
          $unwind: '$team'
        },
        {
          $project: {
            challengeName: '$challenge.name',
            category: '$challenge.category',
            points: '$challenge.points',
            teamName: '$team.name',
            solveTime: '$firstSolve.timestamp'
          }
        },
        {
          $sort: { solveTime: -1 }
        },
        {
          $limit: 10
        }
      ])
      .toArray();

    // Get recent solves
    const recentSolves = await db.collection('solves')
      .aggregate([
        {
          $sort: { timestamp: -1 }
        },
        {
          $limit: 10
        },
        {
          $lookup: {
            from: 'challenges',
            let: { challengeId: '$challengeId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$challengeId' }]
                  }
                }
              }
            ],
            as: 'challenge'
          }
        },
        {
          $lookup: {
            from: 'teams',
            let: { teamId: '$teamId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$teamId' }]
                  }
                }
              }
            ],
            as: 'team'
          }
        },
        {
          $unwind: '$challenge'
        },
        {
          $unwind: '$team'
        },
        {
          $project: {
            teamName: '$team.name',
            challengeName: '$challenge.name',
            category: '$challenge.category',
            points: '$challenge.points',
            timestamp: 1
          }
        }
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      statistics: {
        totalUsers,
        totalTeams,
        challengeStats,
        solveStats,
        mostSolvedChallenges,
        solveTimeDistribution: hourlyData,
        teamSizeDistribution,
        difficultyDistribution,
        firstBloods,
        recentSolves
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics'
    }, { status: 500 });
  }
}
