import 'server-only'
import { sealData, unsealData } from 'iron-session'

export type SessionData = {
  authenticated: boolean
}

function getPassword(): string {
  const password = process.env.SESSION_SECRET
  if (!password) {
    throw new Error('SESSION_SECRET environment variable is not set')
  }
  return password
}

export async function sealSession(): Promise<string> {
  const data: SessionData = { authenticated: true }
  return sealData(data, { password: getPassword() })
}

export async function getSessionFromCookie(
  cookie: string | undefined
): Promise<SessionData> {
  if (!cookie) {
    return { authenticated: false }
  }
  try {
    const data = await unsealData<SessionData>(cookie, { password: getPassword() })
    if (data && typeof data.authenticated === 'boolean') {
      return data
    }
    return { authenticated: false }
  } catch {
    return { authenticated: false }
  }
}
