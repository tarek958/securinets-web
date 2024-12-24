import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import path from 'path';
import fs from 'fs/promises';

// GET endpoint is public
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    
    const settings = await db.collection('settings').findOne({}) || {};
    
    return NextResponse.json({
      ctfName: settings.ctfName || '',
      faviconUrl: settings.faviconUrl || '/favicon.ico'
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST endpoint requires admin authentication
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    
    // Verify admin access
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { error: 'Unauthorized: User data missing' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const ctfName = formData.get('ctfName');
    if (!ctfName) {
      return NextResponse.json(
        { error: 'CTF name is required' },
        { status: 400 }
      );
    }

    const favicon = formData.get('favicon');
    let faviconUrl = null;
    
    // Handle favicon upload if provided
    if (favicon && favicon.size > 0) {
      try {
        const bytes = await favicon.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Ensure public directory exists
        const publicDir = join(process.cwd(), 'public');
        try {
          await fs.access(publicDir);
        } catch {
          await fs.mkdir(publicDir, { recursive: true });
        }

        // Generate unique filename based on timestamp
        const timestamp = Date.now();
        const originalName = favicon.name;
        const ext = path.extname(originalName) || '.ico';
        const filename = `favicon${ext}`;
        const filepath = join(publicDir, filename);

        // Write the file
        await fs.writeFile(filepath, buffer);
        console.log('Favicon saved to:', filepath);
        
        faviconUrl = `/${filename}`;
      } catch (error) {
        console.error('Error saving favicon:', error);
        return NextResponse.json(
          { error: 'Failed to save favicon: ' + error.message },
          { status: 500 }
        );
      }
    }

    // Update settings in database
    const updateData = {
      ctfName,
      ...(faviconUrl && { faviconUrl }),
      updatedAt: new Date(),
      updatedBy: user._id
    };

    try {
      await db.collection('settings').updateOne(
        {},
        { $set: updateData },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
        faviconUrl
      });
    } catch (error) {
      console.error('Error updating database:', error);
      return NextResponse.json(
        { error: 'Failed to update settings in database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
