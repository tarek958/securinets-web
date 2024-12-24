import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import path from 'path';
import fs from 'fs/promises';
import { connectToDatabase } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No download token provided' },
        { status: 401 }
      );
    }

    // Verify download token
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret');
    if (!decoded || decoded.type !== 'download' || !decoded.userId || !decoded.filename) {
      return NextResponse.json(
        { error: 'Invalid download token' },
        { status: 401 }
      );
    }

    // Verify the requested file matches the token
    const { id } = params;
    if (id !== decoded.filename) {
      return NextResponse.json(
        { error: 'Invalid file request' },
        { status: 401 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', 'challenges', id);

    try {
      // Check if file exists
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Connect to database to verify challenge access
    const { db } = await connectToDatabase();
    const challenge = await db.collection('challenges').findOne({
      'files.filename': id,
      status: 'active'
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found or inactive' },
        { status: 404 }
      );
    }

    // Create a ReadStream for the file
    const fileBuffer = await fs.readFile(filePath);
    
    // Get original filename from challenge
    const file = challenge.files.find(f => f.filename === id);
    const originalName = file ? file.originalName : id;
    
    // Determine content type
    const ext = path.extname(originalName).toLowerCase();
    const contentType = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.py': 'text/x-python',
      '.js': 'text/javascript',
      '.c': 'text/x-c',
      '.cpp': 'text/x-c++',
      '.java': 'text/x-java',
      '.php': 'text/x-php',
    }[ext] || 'application/octet-stream';

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${originalName}"`,
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
