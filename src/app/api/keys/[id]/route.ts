import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

// Update key (set default, change label)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { label, setDefault } = await req.json();

  const key = await prisma.apiKey.findFirst({ where: { id, userId } });
  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (setDefault) {
    // Only 1 global default across ALL providers
    await prisma.apiKey.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.apiKey.update({
    where: { id },
    data: {
      ...(label !== undefined && { label }),
      ...(setDefault !== undefined && { isDefault: setDefault }),
    },
  });

  return NextResponse.json({ id: updated.id, isDefault: updated.isDefault });
}

// Delete key
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const key = await prisma.apiKey.findFirst({ where: { id, userId } });
  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.apiKey.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
