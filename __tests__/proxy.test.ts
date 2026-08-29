import { NextRequest } from 'next/server'
import { proxy } from '../proxy'

describe('proxy', () => {
  it('redirects to /login when there is no session cookie', async () => {
    const request = new NextRequest('https://example.com/')
    const response = await proxy(request)
    expect(response?.status).toBe(307)
    expect(response?.headers.get('location')).toContain('/login')
  })

  it('lets the request through when the session cookie is valid', async () => {
    process.env.SESSION_SECRET = 'a'.repeat(32)
    const { sealSession } = await import('../lib/session')
    const sealed = await sealSession()

    const request = new NextRequest('https://example.com/', {
      headers: { cookie: `portfolio_session=${sealed}` },
    })
    const response = await proxy(request)
    expect(response?.status).toBe(200)
  })
})
