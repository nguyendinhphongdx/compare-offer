import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { supabaseId: userId },
    select: { useSystemKey: true },
  });

  return NextResponse.json({ useSystemKey: user?.useSystemKey ?? true });
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { useSystemKey } = await req.json();

  await prisma.user.update({
    where: { supabaseId: userId },
    data: { useSystemKey },
  });

  return NextResponse.json({ success: true });
}
