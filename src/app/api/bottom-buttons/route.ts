import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all bottom buttons (public)
export async function GET(req: NextRequest) {
  try {
    const admin = req.nextUrl.searchParams.get('admin') === 'true';
    const buttons = await db.bottomButton.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // If not admin, only return visible buttons
    const filtered = admin ? buttons : buttons.filter((b) => b.isVisible);
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Create a new bottom button
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, icon, link, color, textColor, bgColor, sortOrder, isVisible } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Button name is required' }, { status: 400 });
    }

    // Get the max sortOrder to append at the end
    const maxSort = await db.bottomButton.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const button = await db.bottomButton.create({
      data: {
        name: name.trim(),
        icon: icon || '⭐',
        link: link || '',
        color: color || '#00f0ff',
        textColor: textColor || '#ffffff',
        bgColor: bgColor || '#1a1b2e',
        sortOrder: sortOrder ?? (maxSort?.sortOrder ?? -1) + 1,
        isVisible: isVisible !== false,
      },
    });

    return NextResponse.json(button, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create button' }, { status: 500 });
  }
}

// PATCH - Update a bottom button
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Button ID is required' }, { status: 400 });
    }

    const button = await db.bottomButton.update({
      where: { id },
      data,
    });

    return NextResponse.json(button);
  } catch {
    return NextResponse.json({ error: 'Failed to update button' }, { status: 500 });
  }
}

// DELETE - Delete a bottom button
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Button ID is required' }, { status: 400 });
    }

    await db.bottomButton.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete button' }, { status: 500 });
  }
}
