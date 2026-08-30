'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { sealSession } from '@/lib/session'

export type LoginState = {
  error?: string
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const passcode = String(formData.get('passcode') ?? '')

  if (!process.env.APP_PASSCODE || passcode !== process.env.APP_PASSCODE) {
    return { error: 'Incorrect passcode' }
  }

  const sealed = await sealSession()
  const cookieStore = await cookies()
  cookieStore.set('portfolio_session', sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  redirect('/')
}
