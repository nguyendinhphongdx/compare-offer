import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json(null);

  const user = await prisma.user.findUnique({
    where: { supabaseId: userId },
    select: { name: true, email: true, avatar: true },
  });

  return NextResponse.json(user);
}
