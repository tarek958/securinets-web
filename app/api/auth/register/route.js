import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    // Basic input validation
    if (!username || !email || !password) {
      return Response.json(
        { error: 'Username, email and password are required' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Username validation
    if (username.length < 3) {
      return Response.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return Response.json(
          { error: 'Email is already registered' },
          { status: 400 }
        );
      }
      if (existingUser.username === username) {
        return Response.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: 'user', // Default role
    });

    await user.save();

    // Create JWT token
    const token = sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    // Set cookie
    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Return user data (without password)
    return Response.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return Response.json(
        { error: validationErrors[0] },
        { status: 400 }
      );
    }

    // Handle other errors
    return Response.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
