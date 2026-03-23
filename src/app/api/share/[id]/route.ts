import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const shared = await prisma.sharedComparison.findUnique({
    where: { id },
  });

  if (!shared) {
    return NextResponse.json({ error: 'Không tìm thấy bài so sánh' }, { status: 404 });
  }

  if (shared.expiresAt && shared.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Link chia sẻ đã hết hạn' }, { status: 410 });
  }

  return NextResponse.json({
    id: shared.id,
    title: shared.title,
    offers: shared.offers,
    criteria: shared.criteria,
    createdAt: shared.createdAt,
  });
}
