import dotenv from 'dotenv';
import { connectDB } from '../lib/db.js';
import { createAdminUser } from '../lib/createAdmin.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function initializeAdmin() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Creating admin user...');
    const admin = await createAdminUser();
    
    if (admin) {
      console.log('Admin initialization completed successfully.');
    }
    
    // Close the Mongoose connection before exiting
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize admin:', error);
    // Make sure to close the connection even if there's an error
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

initializeAdmin();
