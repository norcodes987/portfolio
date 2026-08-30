// Mock next/cache: cacheTag() only works with cacheComponents config enabled.
// This allows testing FX rate fetching without Next.js build-time cache setup.
jest.mock('next/cache', () => ({ cacheTag: jest.fn(), cacheLife: jest.fn() }))

describe('getUsdSgdRate', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns the SGD rate from the Frankfurter response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ amount: 1, base: 'USD', rates: { SGD: 1.35 } }),
    } as Response)

    const { getUsdSgdRate } = await import('../fx')
    const rate = await getUsdSgdRate()

    expect(rate).toBe(1.35)
  })

  it('throws when the FX API responds with an error status', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 503 } as Response)

    const { getUsdSgdRate } = await import('../fx')

    await expect(getUsdSgdRate()).rejects.toThrow('FX rate request failed with status 503')
  })
})
