import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { supabaseId: data.user.id },
        })

        if (!existingUser) {
          await prisma.user.create({
            data: {
              supabaseId: data.user.id,
              email: data.user.email!,
              name:
                data.user.user_metadata?.name ||
                data.user.user_metadata?.full_name ||
                data.user.email?.split('@')[0] ||
                'User',
              avatar: data.user.user_metadata?.avatar_url,
            },
          })
        } else {
          await prisma.user.update({
            where: { supabaseId: data.user.id },
            data: {
              avatar: data.user.user_metadata?.avatar_url || existingUser.avatar,
              name:
                data.user.user_metadata?.name ||
                data.user.user_metadata?.full_name ||
                existingUser.name,
            },
          })
        }
      } catch (dbError) {
        console.error('Failed to sync user with database:', dbError)
      }

      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
