
import { connectToDatabase } from "@/lib/db";
import { SignJWT } from 'jose';
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret'
);

async function getPublicIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching public IP:', error);
    return '127.0.0.1';
  }
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check for existing session
    const existingSession = await db.collection("sessions").findOne({ userId: user._id });
    if (existingSession) {
      console.log('Active session already exists for user:', email);
      return NextResponse.json(
        { error: "Active session already exists. Please log out from the other session first." },
        { status: 403 }
      );
    }

    // Get public IP address
    const ip = await getPublicIP();
    console.log('User public IP:', ip);

    // Add IP to user's history
    await db.collection("users").updateOne(
      { _id: user._id },
      { 
        $push: { 
          ipHistory: {
            ip,
            timestamp: new Date()
          }
        }
      }
    );

    // Create token payload
    const payload = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || 'user'
    };

    console.log('Creating token for user:', payload);

    // Create and sign the token
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(secret);

    // Store new session with IP
    await db.collection("sessions").insertOne({ 
      userId: user._id, 
      token,
      ip,
      createdAt: new Date()
    });

    // Create the response
    const response = NextResponse.json(
      { message: "Login successful", user: payload },
      { status: 200 }
    );

    // Set the token cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      
    });

    console.log('Login successful for user:', email);
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
