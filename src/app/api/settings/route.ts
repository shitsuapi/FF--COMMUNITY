import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET site settings
export async function GET() {
  try {
    let settings = await db.siteSettings.findUnique({ where: { id: 'main' } });
    if (!settings) {
      settings = await db.siteSettings.create({
        data: {
          id: 'main',
          siteName: 'Official FF Community',
          description: 'Your ultimate file-sharing hub. Browse, discover, and download files across multiple categories.',
          logoUrl: '',
        },
      });
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST/UPDATE site settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { siteName, description, logoUrl } = body;

    const settings = await db.siteSettings.upsert({
      where: { id: 'main' },
      update: {
        siteName: siteName?.trim() || 'Official FF Community',
        description: description?.trim() || '',
        logoUrl: logoUrl?.trim() || '',
      },
      create: {
        id: 'main',
        siteName: siteName?.trim() || 'Official FF Community',
        description: description?.trim() || '',
        logoUrl: logoUrl?.trim() || '',
      },
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
