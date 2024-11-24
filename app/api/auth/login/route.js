import { connectToDatabase } from "@/lib/db";
import { SignJWT } from 'jose';
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret'
);

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
