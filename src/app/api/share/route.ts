import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, offerIds } = await request.json();

  if (!offerIds || offerIds.length < 2) {
    return NextResponse.json({ error: 'Cần ít nhất 2 offers' }, { status: 400 });
  }

  // Fetch offers snapshot
  const offers = await prisma.offer.findMany({
    where: { id: { in: offerIds }, userId },
  });

  if (offers.length < 2) {
    return NextResponse.json({ error: 'Không tìm thấy đủ offers' }, { status: 400 });
  }

  // Fetch custom criteria
  const customCriteria = await prisma.customCriterion.findMany({
    where: { userId },
  });

  const shared = await prisma.sharedComparison.create({
    data: {
      userId,
      title: title || `So sánh ${offers.map((o) => o.companyName).join(' vs ')}`,
      offers: JSON.parse(JSON.stringify(offers)),
      criteria: JSON.parse(JSON.stringify(customCriteria)),
    },
  });

  return NextResponse.json({ id: shared.id });
}
