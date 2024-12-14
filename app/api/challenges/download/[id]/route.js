import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Find challenge
    const challenge = await db.collection('challenges').findOne({
      _id: new ObjectId(id)
    });

    if (!challenge || !challenge.file) {
      return NextResponse.json({ error: 'Challenge or file not found' }, { status: 404 });
    }

    // Get file path
    const filePath = path.join(process.cwd(), 'public/challenges', challenge.file);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(challenge.file);

    // Create response with file
    const response = new NextResponse(fileBuffer);

    // Set headers for file download
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    response.headers.set('Content-Type', 'application/octet-stream');
    response.headers.set('Content-Length', fileBuffer.length);

    return response;
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
