import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'

export const config = {
  // Everything is gated except the login page and the public app-shell assets
  // (icons + manifest) that a browser / iOS fetches before the user signs in.
  matcher: [
    '/((?!login|icon|apple-icon|manifest.webmanifest|_next/static|_next/image).*)',
  ],
}

export async function proxy(request: NextRequest) {
  const cookie = request.cookies.get('portfolio_session')?.value
  const session = await getSessionFromCookie(cookie)

  if (!session.authenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}
