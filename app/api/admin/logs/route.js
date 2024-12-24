import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();

    // Get user data from headers
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Get all users with their activities and related data
    const users = await db.collection('users')
      .aggregate([
        {
          $project: {
            username: 1,
            email: 1,
            role: 1,
            ipHistory: 1,
            solvedChallenges: 1,
            lastActivity: { $ifNull: ['$lastActivity', '$createdAt'] },
            createdAt: 1,
            teamId: 1,
            ctfPoints: { $ifNull: ['$ctfPoints', 0] },
            ipChanges: { $size: { $ifNull: ['$ipHistory', []] } }
          }
        },
        // Get user's team info
        {
          $lookup: {
            from: 'teams',
            localField: 'teamId',
            foreignField: '_id',
            as: 'team'
          }
        },
        {
          $unwind: {
            path: '$team',
            preserveNullAndEmptyArrays: true
          }
        },
        // Get all flag submissions (both correct and incorrect)
        {
          $lookup: {
            from: 'submissions',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', { $toString: '$$userId' }] }
                }
              },
              {
                $lookup: {
                  from: 'challenges',
                  let: { challengeId: { $toObjectId: '$challengeId' } },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ['$_id', '$$challengeId'] }
                      }
                    }
                  ],
                  as: 'challenge'
                }
              },
              {
                $unwind: {
                  path: '$challenge',
                  preserveNullAndEmptyArrays: true
                }
              }
            ],
            as: 'submissions'
          }
        },
        // Get successful solves
        {
          $lookup: {
            from: 'solves',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', { $toString: '$$userId' }] }
                }
              },
              {
                $lookup: {
                  from: 'challenges',
                  let: { challengeId: { $toObjectId: '$challengeId' } },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ['$_id', '$$challengeId'] }
                      }
                    }
                  ],
                  as: 'challenge'
                }
              },
              {
                $unwind: {
                  path: '$challenge',
                  preserveNullAndEmptyArrays: true
                }
              }
            ],
            as: 'solves'
          }
        },
        // Get forum posts
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'userId',
            as: 'forumPosts'
          }
        },
        // Get forum comments
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'userId',
            as: 'forumComments'
          }
        },
        // Calculate statistics
        {
          $addFields: {
            submissionStats: {
              total: { $size: '$submissions' },
              correct: {
                $size: {
                  $filter: {
                    input: '$submissions',
                    as: 'sub',
                    cond: { $eq: ['$$sub.isCorrect', true] }
                  }
                }
              },
              wrong: {
                $size: {
                  $filter: {
                    input: '$submissions',
                    as: 'sub',
                    cond: { $eq: ['$$sub.isCorrect', false] }
                  }
                }
              },
              byCategory: {
                $arrayToObject: {
                  $map: {
                    input: {
                      $setUnion: {
                        $map: {
                          input: '$submissions',
                          as: 'sub',
                          in: { $ifNull: ['$$sub.challenge.category', 'uncategorized'] }
                        }
                      }
                    },
                    as: 'category',
                    in: {
                      k: '$$category',
                      v: {
                        total: {
                          $size: {
                            $filter: {
                              input: '$submissions',
                              as: 'sub',
                              cond: { 
                                $eq: [
                                  { $ifNull: ['$$sub.challenge.category', 'uncategorized'] },
                                  '$$category'
                                ]
                              }
                            }
                          }
                        },
                        correct: {
                          $size: {
                            $filter: {
                              input: '$submissions',
                              as: 'sub',
                              cond: {
                                $and: [
                                  { 
                                    $eq: [
                                      { $ifNull: ['$$sub.challenge.category', 'uncategorized'] },
                                      '$$category'
                                    ]
                                  },
                                  { $eq: ['$$sub.isCorrect', true] }
                                ]
                              }
                            }
                          }
                        },
                        points: {
                          $sum: {
                            $map: {
                              input: {
                                $filter: {
                                  input: '$submissions',
                                  as: 'sub',
                                  cond: {
                                    $and: [
                                      { 
                                        $eq: [
                                          { $ifNull: ['$$sub.challenge.category', 'uncategorized'] },
                                          '$$category'
                                        ]
                                      },
                                      { $eq: ['$$sub.isCorrect', true] }
                                    ]
                                  }
                                }
                              },
                              as: 'sub',
                              in: { $ifNull: ['$$sub.points', 0] }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            forumStats: {
              posts: { $size: '$forumPosts' },
              comments: { $size: '$forumComments' }
            },
            // Recent activity combining all types
            recentActivity: {
              $slice: [
                {
                  $sortArray: {
                    input: {
                      $concatArrays: [
                        // Flag submissions
                        {
                          $map: {
                            input: '$submissions',
                            as: 'sub',
                            in: {
                              type: 'flag_submission',
                              timestamp: '$$sub.timestamp',
                              isCorrect: '$$sub.isCorrect',
                              status: '$$sub.status',
                              ip: '$$sub.ip',
                              details: {
                                challengeName: '$$sub.challenge.name',
                                category: { 
                                  $ifNull: ['$$sub.challenge.category', 'uncategorized']
                                },
                                points: '$$sub.points',
                                flag: '$$sub.flag'
                              }
                            }
                          }
                        },
                        // Forum posts
                        {
                          $map: {
                            input: '$forumPosts',
                            as: 'post',
                            in: {
                              type: 'forum_post',
                              timestamp: '$$post.createdAt',
                              details: {
                                title: '$$post.title'
                              }
                            }
                          }
                        },
                        // Forum comments
                        {
                          $map: {
                            input: '$forumComments',
                            as: 'comment',
                            in: {
                              type: 'forum_comment',
                              timestamp: '$$comment.createdAt',
                              details: {
                                postId: '$$comment.postId'
                              }
                            }
                          }
                        },
                        // IP changes
                        {
                          $map: {
                            input: { $ifNull: ['$ipHistory', []] },
                            as: 'ip',
                            in: {
                              type: 'ip_change',
                              timestamp: '$$ip.timestamp',
                              ip: '$$ip.ip'
                            }
                          }
                        }
                      ]
                    },
                    sortBy: { timestamp: -1 }
                  }
                },
                50
              ]
            }
          }
        },
        {
          $sort: { lastActivity: -1 }
        }
      ]).toArray();

    return NextResponse.json(users);

  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
