import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'

export const config = {
  matcher: [
    '/((?!login|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)',
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
