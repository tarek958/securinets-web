import User from '../models/User.js';

export async function createAdminUser() {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('No admin user found. Creating admin user...');
      
      // Admin credentials - these should be changed after first login
      const adminData = {
        username: process.env.ADMIN_USERNAME || 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@securinets.tn',
        password: process.env.ADMIN_PASSWORD || 'adminSecurinets2024!',
        role: 'admin',
        isVerified: true,
        ctfPoints: 0,
        badges: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const admin = await User.create(adminData);
      console.log('Admin user created successfully:', admin.username);
      return admin;
    } else {
      console.log('Admin user already exists:', adminExists.username);
      return adminExists;
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}
