import { Server } from 'socket.io';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "securinets";

let io;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return { db: cachedDb };
  }

  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);
  cachedDb = db;
  return { db };
}

export async function updateLeaderboard() {
  try {
    const { db } = await connectToDatabase();
    
    // Get users with solved challenges populated
    const users = await db.collection('users')
      .aggregate([
        {
          $lookup: {
            from: 'challenges',
            localField: 'solvedChallenges',
            foreignField: '_id',
            as: 'solvedChallengesDetails'
          }
        },
        {
          $project: {
            username: 1,
            ctfPoints: 1,
            solvedChallenges: 1,
            solvedChallengesDetails: {
              title: 1,
              category: 1,
              points: 1
            }
          }
        },
        {
          $sort: { ctfPoints: -1 }
        }
      ]).toArray();

    // Format leaderboard data
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      _id: user._id,
      username: user.username,
      totalPoints: user.ctfPoints || 0,
      challengeCount: Array.isArray(user.solvedChallenges) ? user.solvedChallenges.length : 0,
      solvedChallenges: user.solvedChallengesDetails.map(challenge => ({
        title: challenge.title,
        category: challenge.category,
        points: challenge.points
      }))
    }));

    // Emit to all connected clients
    if (io) {
      io.emit('leaderboard-update', { leaderboard });
      console.log('Emitted leaderboard update to all clients');
    } else {
      console.warn('Socket.IO not initialized');
    }

    return leaderboard;
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    throw error;
  }
}

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket'
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send initial leaderboard data on connection
    updateLeaderboard()
      .then(leaderboard => {
        socket.emit('leaderboard-update', { leaderboard });
      })
      .catch(error => {
        console.error('Error sending initial leaderboard:', error);
      });

    // Join leaderboard room
    socket.on('join-leaderboard', () => {
      socket.join('leaderboard');
      console.log('Client joined leaderboard room:', socket.id);
    });

    // Leave leaderboard room
    socket.on('leave-leaderboard', () => {
      socket.leave('leaderboard');
      console.log('Client left leaderboard room:', socket.id);
    });

    // Handle flag submission updates
    socket.on('flag-submitted', async (data) => {
      try {
        await updateLeaderboard();
      } catch (error) {
        console.error('Error updating leaderboard after flag submission:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
