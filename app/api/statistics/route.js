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
          $lookup: {
            from: 'challenges',
            let: { challengeId: '$challengeId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$challengeId' }] }
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
            _id: '$challengeId',
            challenge: { $first: '$challenge' },
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
          $project: {
            _id: 1,
            name: '$challenge.name',
            title: '$challenge.title',
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
            challengeName: { $ifNull: ['$challenge.title', '$challenge.name'] },
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
            challengeName: { $ifNull: ['$challenge.title', '$challenge.name'] },
            category: '$challenge.category',
            points: '$challenge.points',
            timestamp: 1
          }
        }
      ])
      .toArray();

    // Debug: Get a sample challenge to check its structure
    const sampleChallenge = await db.collection('challenges').findOne({});
    console.log('Sample challenge structure:', JSON.stringify(sampleChallenge, null, 2));

    // Get solved challenges with all users who solved them
    const solvedChallenges = await db.collection('solves')
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
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  category: 1,
                  points: 1,
                  title: 1  // Some challenges might use 'title' instead of 'name'
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
          $lookup: {
            from: 'users',
            let: { userId: '$userId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$userId' }]
                  }
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
                $unwind: {
                  path: '$team',
                  preserveNullAndEmptyArrays: true
                }
              }
            ],
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: '$challenge._id',
            name: { 
              $first: {
                $cond: [
                  { $ifNull: ['$challenge.name', false] },
                  '$challenge.name',
                  { $ifNull: ['$challenge.title', 'Unknown Challenge'] }
                ]
              }
            },
            category: { $first: '$challenge.category' },
            points: { $first: '$challenge.points' },
            solveCount: { $sum: 1 },
            solves: {
              $push: {
                _id: '$_id',
                timestamp: '$timestamp',
                user: {
                  _id: '$user._id',
                  username: '$user.username',
                  team: '$user.team'
                }
              }
            }
          }
        },
        {
          $sort: { solveCount: -1 }
        }
      ])
      .toArray();

    // Log the first challenge to debug
    if (solvedChallenges.length > 0) {
      console.log('First challenge structure:', JSON.stringify(solvedChallenges[0], null, 2));
    }

    // Get top 10 teams
    const topTeams = await db.collection('teams')
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'teamId',
            as: 'members'
          }
        },
        {
          $lookup: {
            from: 'solves',
            let: { memberIds: '$members._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [{ $toObjectId: '$userId' }, { $map: { input: '$$memberIds', as: 'id', in: { $toObjectId: '$$id' } } }]
                  }
                }
              }
            ],
            as: 'solves'
          }
        },
        {
          $lookup: {
            from: 'challenges',
            let: { solveIds: '$solves.challengeId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$_id', { $map: { input: '$$solveIds', as: 'id', in: { $toObjectId: '$$id' } } }]
                  }
                }
              }
            ],
            as: 'challenges'
          }
        },
        {
          $addFields: {
            totalPoints: { $sum: '$challenges.points' },
            solveCount: { $size: '$solves' }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            totalPoints: 1,
            solveCount: 1,
            memberCount: { $size: '$members' }
          }
        },
        {
          $match: {
            totalPoints: { $gt: 0 }
          }
        },
        {
          $sort: { totalPoints: -1, solveCount: -1 }
        },
        {
          $limit: 10
        }
      ])
      .toArray();

    // Debug log
    console.log('Top teams:', JSON.stringify(topTeams, null, 2));

    // Get team progression data
    const teamProgressions = await db.collection('teams')
      .aggregate([
        {
          $lookup: {
            from: 'solves',
            let: { teamId: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$teamId', '$$teamId'] }
                }
              },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d %H:00:00',
                      date: '$timestamp'
                    }
                  },
                  points: { $sum: '$points' }
                }
              },
              {
                $sort: { _id: 1 }
              }
            ],
            as: 'hourlyPoints'
          }
        },
        {
          $match: {
            'hourlyPoints.0': { $exists: true }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            progression: {
              timeline: {
                $map: {
                  input: '$hourlyPoints',
                  as: 'point',
                  in: {
                    _id: '$$point._id',
                    points: '$$point.points'
                  }
                }
              }
            }
          }
        }
      ])
      .toArray();

    // Debug log
    console.log('Team progressions:', JSON.stringify(teamProgressions, null, 2));

    // Get top 10 users
    const topUsers = await db.collection('users')
      .aggregate([
        {
          $lookup: {
            from: 'solves',
            localField: '_id',
            foreignField: 'userId',
            as: 'solves'
          }
        },
        {
          $lookup: {
            from: 'challenges',
            localField: 'solves.challengeId',
            foreignField: '_id',
            as: 'challenges'
          }
        },
        {
          $lookup: {
            from: 'teams',
            localField: 'teamId',
            foreignField: '_id',
            as: 'team'
          }
        },
        {
          $addFields: {
            totalPoints: { $sum: '$challenges.points' },
            solveCount: { $size: '$solves' },
            team: { $arrayElemAt: ['$team', 0] }
          }
        },
        {
          $project: {
            _id: 1,
            username: 1,
            totalPoints: 1,
            solveCount: 1,
            team: {
              _id: 1,
              name: 1
            }
          }
        },
        {
          $sort: { totalPoints: -1, solveCount: -1 }
        },
        {
          $limit: 10
        }
      ])
      .toArray();

    // Get user progression data
    const userProgressions = await db.collection('users')
      .aggregate([
        {
          $lookup: {
            from: 'solves',
            let: { userId: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', '$$userId'] }
                }
              },
              {
                $lookup: {
                  from: 'challenges',
                  let: { challengeId: '$challengeId' },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ['$_id', { $toObjectId: '$$challengeId' }] }
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
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d %H:00:00',
                      date: { $toDate: '$timestamp' }
                    }
                  },
                  points: { $sum: '$challenge.points' }
                }
              },
              {
                $sort: { '_id': 1 }
              }
            ],
            as: 'timeline'
          }
        },
        {
          $project: {
            username: 1,
            progression: {
              timeline: {
                $map: {
                  input: '$timeline',
                  as: 'point',
                  in: {
                    _id: '$$point._id',
                    points: '$$point.points'
                  }
                }
              }
            }
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
        recentSolves,
        solvedChallenges,
        topTeams,
        topUsers,
        teamProgressions,
        userProgressions
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
