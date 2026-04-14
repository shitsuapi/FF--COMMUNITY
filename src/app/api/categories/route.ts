import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all categories
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST create category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, color, imageUrl } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await db.category.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 409 }
      );
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || '',
        color: color || '#00f0ff',
        imageUrl: imageUrl?.trim() || '',
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PATCH update category
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, color, imageUrl } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (color !== undefined) updateData.color = color;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || '';

    const category = await db.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(category);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    await db.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
