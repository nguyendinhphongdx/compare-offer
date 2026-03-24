import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json(null);

  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { name: true, email: true, avatar: true },
  });

  // Auto-create if missing (self-healing for failed signups)
  if (!user) {
    try {
      user = await prisma.user.upsert({
        where: { email: authUser.email! },
        create: {
          supabaseId: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          avatar: authUser.user_metadata?.avatar_url || null,
        },
        update: {
          supabaseId: authUser.id,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || undefined,
          avatar: authUser.user_metadata?.avatar_url || undefined,
        },
        select: { name: true, email: true, avatar: true },
      });
    } catch {
      return NextResponse.json(null);
    }
  }

  return NextResponse.json(user);
}
