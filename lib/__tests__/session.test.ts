import { sealSession, getSessionFromCookie } from '../session'

beforeAll(() => {
  process.env.SESSION_SECRET = 'a'.repeat(32)
})

describe('session', () => {
  it('round-trips a sealed session as authenticated', async () => {
    const sealed = await sealSession()
    const session = await getSessionFromCookie(sealed)
    expect(session.authenticated).toBe(true)
  })

  it('treats a missing cookie as unauthenticated', async () => {
    const session = await getSessionFromCookie(undefined)
    expect(session.authenticated).toBe(false)
  })

  it('treats a garbage cookie as unauthenticated', async () => {
    const session = await getSessionFromCookie('not-a-real-sealed-value')
    expect(session.authenticated).toBe(false)
  })
})
