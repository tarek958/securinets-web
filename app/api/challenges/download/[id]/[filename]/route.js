import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request, { params }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { filename } = params;
    const filePath = path.join(process.cwd(), 'public', 'challenges', filename);

    try {
      // Check if file exists
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Create a ReadStream for the file
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase();
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
        'Content-Disposition': `attachment; filename="${filename}"`,
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
