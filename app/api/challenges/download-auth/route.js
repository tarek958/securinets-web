import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { verify } from 'jsonwebtoken';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret'
);

export async function POST(request) {
  try {
    // Get token from auth-token cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    try {
      // First verify the token directly
      const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      // Get filename from request body
      const { filename } = await request.json();
      if (!filename) {
        return NextResponse.json(
          { error: 'Filename is required' },
          { status: 400 }
        );
      }

      // Connect to database to verify challenge access
      const { db } = await connectToDatabase();
      const challenge = await db.collection('challenges').findOne({
        $or: [
          { 'files.filename': filename },
          { 'files.name': filename }
        ],
        status: 'active'
      });

      if (!challenge) {
        return NextResponse.json(
          { error: 'Challenge not found or inactive' },
          { status: 404 }
        );
      }

      // Find the actual file object
      const file = challenge.files.find(f => f.filename === filename || f.name === filename);
      if (!file) {
        return NextResponse.json(
          { error: 'File not found in challenge' },
          { status: 404 }
        );
      }

      // Create a short-lived download token
      const downloadToken = await new SignJWT({
        userId: decoded.id,
        filename: file.filename || file.name,
        type: 'download'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('5m') // Token expires in 5 minutes
        .sign(secret);

      // Return the download URL with the token
      return NextResponse.json({
        downloadUrl: `/api/challenges/download/${file.filename || file.name}?token=${downloadToken}`
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
