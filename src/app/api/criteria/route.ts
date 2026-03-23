import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const criteria = await prisma.customCriterion.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(criteria);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const criterion = await prisma.customCriterion.create({ data: { ...body, userId } });
  return NextResponse.json(criterion);
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await prisma.customCriterion.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
