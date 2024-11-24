import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/securinets';

let cachedDb = null;

export async function connectToDatabase() {
  if (cachedDb) {
    return { db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();
  cachedDb = db;
  return { db };
}

// For Mongoose connections (used by models)
if (!mongoose.connections[0].readyState) {
  mongoose.set('strictQuery', false);
}

export async function connectDB() {
  try {
    if (mongoose.connections[0].readyState) {
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Export the mongoose instance for use in other files
export { mongoose };
