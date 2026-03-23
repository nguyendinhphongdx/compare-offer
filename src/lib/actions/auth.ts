'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export type AuthResult = {
  error?: string
  success?: boolean
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password || !name) {
    return { error: 'Vui lòng điền đầy đủ thông tin' }
  }

  if (password.length < 6) {
    return { error: 'Mật khẩu phải có ít nhất 6 ký tự' }
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    try {
      await prisma.user.create({
        data: {
          supabaseId: data.user.id,
          email: data.user.email!,
          name,
        },
      })
    } catch (dbError) {
      console.error('Failed to create user in database:', dbError)
    }
  }

  return { success: true }
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Vui lòng nhập email và mật khẩu' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Sync user with Prisma if not exists
  if (data.user) {
    try {
      const name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'
      await prisma.user.upsert({
        where: { supabaseId: data.user.id },
        create: {
          supabaseId: data.user.id,
          email: data.user.email!,
          name,
        },
        update: { name },
      })
    } catch {
      const name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'
      await prisma.user.update({
        where: { email: data.user.email! },
        data: { supabaseId: data.user.id, name },
      }).catch(() => {})
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  try {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })
    return dbUser
  } catch {
    return null
  }
}
