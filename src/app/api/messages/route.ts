import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const messages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { timestamp: 'asc' },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const message = await prisma.chatMessage.create({ data: { ...body, userId } });
  return NextResponse.json(message);
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, content } = await req.json();
  await prisma.chatMessage.updateMany({
    where: { id, userId },
    data: { content },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.chatMessage.deleteMany({ where: { userId } });
  return NextResponse.json({ ok: true });
}
