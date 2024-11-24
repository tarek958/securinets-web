import { NextResponse } from 'next/server';
import { connectToDatabase, connectDB } from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

async function getLeaderboard() {
  try {
    // Connect to MongoDB using both methods for compatibility
    await connectDB();
    const { db } = await connectToDatabase();
    
    // First try using Mongoose
    let users = await User.aggregate([
      {
        $project: {
          username: 1,
          solvedChallenges: 1,
          score: { $ifNull: ['$ctfPoints', 0] },
          lastSolve: {
            $ifNull: [
              { 
                $max: {
                  $map: {
                    input: { 
                      $filter: { 
                        input: "$solvedChallenges",
                        as: "solve",
                        cond: { $ne: ["$$solve.solvedAt", null] }
                      }
                    },
                    as: "solve",
                    in: "$$solve.solvedAt"
                  }
                }
              },
              new Date(0)
            ]
          }
        }
      },
      {
        $sort: {
          score: -1,
          lastSolve: 1
        }
      }
    ]);

    // If Mongoose fails, fallback to native MongoDB
    if (!users || users.length === 0) {
      users = await db.collection('users').aggregate([
        {
          $project: {
            username: 1,
            solvedChallenges: 1,
            score: { $ifNull: ['$ctfPoints', 0] },
            lastSolve: {
              $ifNull: [
                { 
                  $max: {
                    $map: {
                      input: { 
                        $filter: { 
                          input: "$solvedChallenges",
                          as: "solve",
                          cond: { $ne: ["$$solve.solvedAt", null] }
                        }
                      },
                      as: "solve",
                      in: "$$solve.solvedAt"
                    }
                  }
                },
                new Date(0)
              ]
            }
          }
        },
        {
          $sort: {
            score: -1,
            lastSolve: 1
          }
        }
      ]).toArray();
    }

    // Ensure we have data
    if (!users || users.length === 0) {
      return [];
    }

    return users.map((user, index) => ({
      ...user,
      rank: index + 1,
      score: user.score || 0,
      solvedCount: user.solvedChallenges ? user.solvedChallenges.length : 0,
      lastSolve: user.lastSolve || new Date(0)
    }));

  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    throw error;
  }
}

export async function GET(request) {
  try {
    const leaderboard = await getLeaderboard();
    
    return NextResponse.json({
      success: true,
      data: leaderboard
    });

  } catch (error) {
    console.error('Leaderboard API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leaderboard',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
