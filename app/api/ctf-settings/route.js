import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const settings = await db.collection('ctfSettings').findOne({});
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'CTF settings not found'
      });
    }

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching CTF settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch CTF settings'
    });
  }
}
