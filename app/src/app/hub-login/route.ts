import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, createToken } from '@/lib/auth'
import { ensureManagedLocalUser, isFjordHubManaged, verifyFjordHubSsoToken } from '@/lib/fjordhub'

export async function GET(req: NextRequest) {
  if (!isFjordHubManaged()) return NextResponse.redirect(new URL('/login', req.url))

  const token = req.nextUrl.searchParams.get('token')?.trim() || ''
  if (!token) return NextResponse.redirect(new URL('/login?error=hub-token', req.url))

  const hubUser = await verifyFjordHubSsoToken(token)
  if (!hubUser) return NextResponse.redirect(new URL('/login?error=hub-login', req.url))

  const user = await ensureManagedLocalUser(hubUser)
  const sessionToken = await createToken({ userId: user.id, username: user.username })
  const response = NextResponse.redirect(new URL('/dashboard', req.url))
  response.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.nextUrl.protocol === 'https:',
    maxAge: 8 * 60 * 60,
    path: '/',
  })
  return response
}
