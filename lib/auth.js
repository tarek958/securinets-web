import jwt from 'jsonwebtoken';
import { connectDB } from './db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function verifyAuth(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No token provided' };
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return { success: false, error: 'Invalid token' };
    }

    // Get user from database
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { 
      success: true, 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        ctfPoints: user.ctfPoints
      }
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export async function generateToken(user) {
  return jwt.sign(
    { 
      userId: user._id,
      username: user.username,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function isAdmin(user) {
  return user && user.role === 'admin';
}
