import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

function maskKey(key: string) {
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}${'•'.repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`;
}

// List all keys for current user
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(
    keys.map((k) => ({
      id: k.id,
      provider: k.provider,
      label: k.label,
      maskedKey: maskKey(k.apiKey),
      isDefault: k.isDefault,
      isValid: k.isValid,
      createdAt: k.createdAt,
    }))
  );
}

// Create a new key
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { provider, label, apiKey, setDefault } = await req.json();

  if (!provider || !apiKey) {
    return NextResponse.json({ error: 'Provider và API key là bắt buộc' }, { status: 400 });
  }

  // Only 1 global default across ALL providers
  const isFirstKey = !(await prisma.apiKey.findFirst({ where: { userId } }));
  const makeDefault = setDefault ?? isFirstKey;

  if (makeDefault) {
    await prisma.apiKey.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const key = await prisma.apiKey.create({
    data: {
      userId,
      provider,
      label: label || null,
      apiKey,
      isDefault: makeDefault,
    },
  });

  return NextResponse.json({
    id: key.id,
    provider: key.provider,
    label: key.label,
    maskedKey: maskKey(key.apiKey),
    isDefault: key.isDefault,
    isValid: key.isValid,
  });
}
