import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export async function POST(request) {
  try {
    const userData = JSON.parse(request.headers.get('x-user-data') || '{}');
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Create backups directory if it doesn't exist
    try {
      await fs.access(BACKUP_DIR);
    } catch {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `securinets-${timestamp}.gz`);

    // Execute mongodump command
    const { stdout, stderr } = await execAsync(
      `mongodump --db securinets --archive="${backupPath}" --gzip`
    );

    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      path: backupPath
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const userData = JSON.parse(request.headers.get('x-user-data') || '{}');
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { backupPath } = await request.json();

    // Verify backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Backup file not found' },
        { status: 404 }
      );
    }

    // Execute mongorestore command
    const { stdout, stderr } = await execAsync(
      `mongorestore --drop --archive="${backupPath}" --gzip`
    );

    return NextResponse.json({
      success: true,
      message: 'Database restored successfully'
    });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore backup' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const userData = JSON.parse(request.headers.get('x-user-data') || '{}');
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Create backups directory if it doesn't exist
    try {
      await fs.access(BACKUP_DIR);
    } catch {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    }

    // Get list of backup files
    const files = await fs.readdir(BACKUP_DIR);
    const backups = await Promise.all(
      files
        .filter(file => file.startsWith('securinets-') && file.endsWith('.gz'))
        .map(async file => {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime
          };
        })
    );

    return NextResponse.json({
      success: true,
      backups: backups.sort((a, b) => b.created - a.created)
    });
  } catch (error) {
    console.error('List backups error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list backups' },
      { status: 500 }
    );
  }
}
