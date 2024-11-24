import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/mongodb.js';
import { createAdminUser } from '../lib/createAdmin.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function initializeAdmin() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    
    console.log('Creating admin user...');
    const admin = await createAdminUser();
    
    if (admin) {
      console.log(' Admin user operation completed successfully');
      console.log('Admin email:', admin.email);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(' Error during admin creation:', error);
    process.exit(1);
  }
}

initializeAdmin();
