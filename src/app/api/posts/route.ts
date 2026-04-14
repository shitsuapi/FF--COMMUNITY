import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all posts (with optional category filter, search, and admin mode)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const slug = searchParams.get('slug');
    const admin = searchParams.get('admin');

    let categoryFilter: { categoryId?: string } = {};

    if (categoryId) {
      categoryFilter.categoryId = categoryId;
    } else if (slug) {
      const category = await db.category.findUnique({ where: { slug } });
      if (category) {
        categoryFilter.categoryId = category.id;
      }
    }

    const where: Record<string, unknown> = {
      ...categoryFilter,
      // Only show visible posts to public users
      ...(!admin ? { isVisible: true } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const posts = await db.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });

    return NextResponse.json(posts);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST create post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, imageUrl, downloadUrl, buttonText, buttonColor, buttonLink, warning, categoryId, isVisible } =
      body;

    if (!title || !description || !downloadUrl || !categoryId) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    const post = await db.post.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        imageUrl: (imageUrl || '').trim(),
        downloadUrl: downloadUrl.trim(),
        buttonText: buttonText?.trim() || 'Download',
        buttonColor: buttonColor || '#3b82f6',
        buttonLink: buttonLink?.trim() || '',
        warning: warning?.trim() || '',
        categoryId,
        isVisible: isVisible !== false,
      },
      include: { category: true },
    });

    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

// PATCH toggle post visibility
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isVisible, buttonText, buttonColor, buttonLink, warning } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (isVisible !== undefined) updateData.isVisible = isVisible;
    if (buttonText !== undefined) updateData.buttonText = buttonText;
    if (buttonColor !== undefined) updateData.buttonColor = buttonColor;
    if (buttonLink !== undefined) updateData.buttonLink = buttonLink;
    if (warning !== undefined) updateData.warning = warning;

    const post = await db.post.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return NextResponse.json(post);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE post
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    await db.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
