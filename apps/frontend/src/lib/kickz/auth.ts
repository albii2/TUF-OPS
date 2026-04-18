import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SELLER_AUTH_COOKIE = 'kickz_seller_auth'

export async function createSellerSession(password: string) {
  const expectedPassword = process.env.SELLER_PASSWORD ?? 'kickz-admin'
  if (password !== expectedPassword) {
    return { ok: false, error: 'Invalid seller credentials.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(SELLER_AUTH_COOKIE, 'ok', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return { ok: true }
}

export async function requireSellerSession() {
  const cookieStore = await cookies()
  const isAuthed = cookieStore.get(SELLER_AUTH_COOKIE)?.value === 'ok'
  if (!isAuthed) {
    redirect('/seller/login')
  }
}
