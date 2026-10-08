import { NextRequest, NextResponse } from 'next/server'
import { createToken, COOKIE_NAME } from '@/lib/auth'
import { changeFjordHubPassword, ensureManagedLocalUser, isFjordHubManaged } from '@/lib/fjordhub'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Brugernavn, nuværende og ny adgangskode er påkrævet' },
        { status: 400 }
      )
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Den nye adgangskode skal være mindst 6 tegn' },
        { status: 400 }
      )
    }
    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: 'Den nye adgangskode skal være forskellig fra den nuværende' },
        { status: 400 }
      )
    }

    if (!isFjordHubManaged()) {
      return NextResponse.json({ error: 'Skift af adgangskode håndteres ikke her' }, { status: 400 })
    }

    const { user: hubUser, error } = await changeFjordHubPassword(username, currentPassword, newPassword)
    if (!hubUser) {
      return NextResponse.json(
        { error: error || 'Kunne ikke skifte adgangskoden i FjordHub' },
        { status: 401 }
      )
    }

    // Koden er skiftet - log brugeren ind med det samme
    const user = await ensureManagedLocalUser(hubUser)
    const token = await createToken({ hubUserId: hubUser.id, userId: user.id, username: user.username })
    const response = NextResponse.json({ success: true, username: user.username })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:',
      maxAge: 8 * 60 * 60,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}
