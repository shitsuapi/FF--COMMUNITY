import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.redirect(new URL('/?error=invalid', request.url));
    }

    const post = await db.post.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.redirect(new URL('/?error=notfound', request.url));
    }

    return NextResponse.redirect(post.downloadUrl);
  } catch {
    return NextResponse.redirect(new URL('/?error=server', request.url));
  }
}
