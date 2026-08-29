# Portfolio Dashboard Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the data + auth foundation for the portfolio dashboard: a passcode gate, a Google Sheets data layer with a DRY parsing boundary, Next.js 16 Cache Components caching with a manual refresh action, and a minimal authenticated page proving the whole pipeline works end to end.

**Architecture:** Next.js 16 App Router with `cacheComponents: true`. `proxy.ts` gates every route behind an `iron-session`-sealed cookie. `lib/sheets/client.ts` reads raw rows from the Google Sheets API via a service account; `lib/sheets/parse.ts` is the single place that turns those messy raw rows into typed domain models; `lib/sheets/fetch.ts` wraps each tab's fetch+parse in `'use cache'` with a shared `cacheTag('portfolio')`. A Server Action calls `updateTag('portfolio')` to refresh on demand.

**Tech Stack:** Next.js 16 (App Router, Cache Components), React 19, TypeScript, `googleapis`, `iron-session`, Jest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-28-portfolio-dashboard-design.md`

## Global Constraints

- This directory (`/workspace/portfolio`) is a subdirectory inside a much larger shared git repo containing many unrelated projects with their own pending changes. **Never run `git add -A`, `git add .`, or `git add -u`.** Every `git add` in this plan lists exact file paths relative to `/workspace/portfolio` — add only those.
- This Next.js version (16.3.3) has breaking changes from older training data. Two that directly affect this plan: (1) `middleware.js` is deprecated and renamed to `proxy.js` (exported function name `proxy`, not `middleware`) — using `middleware.ts` will silently not run; (2) caching requires the Cache Components model (`use cache` / `cacheLife` / `cacheTag` / `updateTag`), not legacy `revalidate`/ISR config. When in doubt, check `node_modules/next/dist/docs/`.
- `updateTag` only works inside a Server Action (`'use server'`), never in a Route Handler or Client Component.
- A plain `'use cache'` function cannot call `cookies()` or `headers()` — this rules out reading the session inside any cached Sheets/FX fetch function.
- No live Google Sheet credentials exist in this environment. Tasks touching `lib/sheets/client.ts` or the live end-to-end page are unit-testable only up to the mocking boundary; the final manual smoke test requires a human to supply real env vars.
- Secrets (`APP_PASSCODE`, `SESSION_SECRET`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_SHEET_ID`) live only in `.env.local` (already gitignored by the create-next-app default `.gitignore`) or in Vercel env vars — never commit real values.

---

### Task 1: Jest test infrastructure

**Files:**
- Modify: `package.json`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `__tests__/smoke.test.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `npm test` / `npm run test:watch` scripts; every later task's tests run under this Jest config with `testEnvironment: 'node'` by default (component tests in the later UI plan override with a `/** @jest-environment jsdom */` docblock).

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node @types/jest
```

- [ ] **Step 2: Create the Jest config**

```ts
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 3: Create the Jest setup file**

```ts
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test scripts to `package.json`**

Add to the `"scripts"` object:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: Write a smoke test**

```ts
// __tests__/smoke.test.ts
describe('jest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run it and confirm it passes**

Run: `npm test`
Expected: 1 passed, 1 total

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json jest.config.ts jest.setup.ts __tests__/smoke.test.ts
git commit -m "chore: add Jest test infrastructure"
```

---

### Task 2: Enable Cache Components

**Files:**
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `cacheComponents: true`; a custom `cacheLife` profile named `portfolioData` (`stale: 300, revalidate: 1800, expire: 7200`, i.e. 5 min / 30 min / 2 hr) that Task 10's fetch functions and Task 11's FX function will reference by name.

- [ ] **Step 1: Update the Next.js config**

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    portfolioData: {
      stale: 300, // 5 minutes
      revalidate: 1800, // 30 minutes
      expire: 7200, // 2 hours
    },
  },
};

export default nextConfig;
```

- [ ] **Step 2: Confirm the app still builds**

Run: `npx next build`
Expected: build succeeds (the default scaffolded page has no dynamic/session reads yet, so Cache Components validation should pass cleanly).

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: enable Next.js Cache Components with a portfolioData cache profile"
```

---

### Task 3: Environment variable scaffolding

**Files:**
- Modify: `.gitignore`
- Create: `.env.local.example`

**Interfaces:**
- Consumes: nothing
- Produces: documents the 5 env vars every later task reads: `APP_PASSCODE`, `SESSION_SECRET`, `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.

- [ ] **Step 1: Check how env files are gitignored**

Run: `grep -n "env" .gitignore`
Expected output in this repo: `.env*` (broader than the create-next-app default `.env*.local`). This pattern also matches `.env.local.example`, so it needs an explicit negation or the example file can never be committed.

- [ ] **Step 2: Add a negation exception for the example file**

Append to `.gitignore`:

```gitignore
!.env.local.example
```

- [ ] **Step 3: Create the example env file**

```bash
# .env.local.example

# Single shared passcode for the password gate. Any string.
APP_PASSCODE=

# Random secret >=32 chars, used to sign the session cookie (iron-session).
# Generate one with: openssl rand -base64 32
SESSION_SECRET=

# The Google Sheet ID from its URL:
# https://docs.google.com/spreadsheets/d/<THIS_PART>/edit
GOOGLE_SHEET_ID=

# Service account credentials (Google Cloud Console > IAM > Service Accounts).
# Share the Sheet with this service account's email as Viewer.
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
```

- [ ] **Step 4: Confirm the example file is actually stageable**

Run: `git add .env.local.example && git status --short .env.local.example`
Expected: shows `A  .env.local.example` (staged), not an "ignored" warning. If it's still ignored, the negation pattern in Step 2 needs to move below the `.env*` line it's meant to override (`.gitignore` negations only work if they come after the pattern they exclude from).

- [ ] **Step 5: Commit**

```bash
git add .gitignore .env.local.example
git commit -m "docs: document required environment variables"
```

---

### Task 4: Session sealing/unsealing (`lib/session.ts`)

**Files:**
- Create: `lib/session.ts`
- Test: `lib/__tests__/session.test.ts`

**Interfaces:**
- Consumes: `process.env.SESSION_SECRET`
- Produces: `sealSession(): Promise<string>`, `getSessionFromCookie(cookie: string | undefined): Promise<SessionData>`, `type SessionData = { authenticated: boolean }`. Task 5 (login action) calls `sealSession`; Task 6 (`proxy.ts`) calls `getSessionFromCookie`.

- [ ] **Step 1: Install iron-session**

```bash
npm install iron-session
```

- [ ] **Step 2: Write the failing test**

```ts
// lib/__tests__/session.test.ts
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
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- lib/__tests__/session.test.ts`
Expected: FAIL — `Cannot find module '../session'`

- [ ] **Step 4: Implement `lib/session.ts`**

```ts
// lib/session.ts
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
    return await unsealData<SessionData>(cookie, { password: getPassword() })
  } catch {
    return { authenticated: false }
  }
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npm test -- lib/__tests__/session.test.ts`
Expected: 3 passed, 3 total

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/session.ts lib/__tests__/session.test.ts
git commit -m "feat: add iron-session sealing for the passcode gate"
```

---

### Task 5: Login page and action

**Files:**
- Create: `app/login/actions.ts`
- Create: `app/login/page.tsx`
- Test: `app/login/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: `sealSession` from `lib/session.ts` (Task 4)
- Produces: `login(prevState: LoginState, formData: FormData): Promise<LoginState>` where `type LoginState = { error?: string }`; sets a cookie named `portfolio_session`. Task 6's `proxy.ts` redirects unauthenticated requests to `/login`, which this task's page serves.

- [ ] **Step 1: Write the Server Action**

```ts
// app/login/actions.ts
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
```

- [ ] **Step 2: Write the login page (Client Component using `useActionState`)**

```tsx
// app/login/page.tsx
'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'

const initialState: LoginState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Portfolio</h1>
        <label htmlFor="passcode" className="block text-sm font-medium">
          Passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          autoFocus
          required
          className="w-full rounded border px-3 py-2"
        />
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Write a render test for the page**

```tsx
// app/login/__tests__/page.test.tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import LoginPage from '../page'

describe('LoginPage', () => {
  it('renders a passcode input and submit button', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Passcode')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- app/login`
Expected: 1 passed, 1 total

- [ ] **Step 5: Commit**

```bash
git add app/login/actions.ts app/login/page.tsx app/login/__tests__/page.test.tsx
git commit -m "feat: add passcode login page and server action"
```

---

### Task 6: `proxy.ts` auth gate

**Files:**
- Create: `proxy.ts`
- Test: `__tests__/proxy.test.ts`

**Interfaces:**
- Consumes: `getSessionFromCookie` from `lib/session.ts` (Task 4)
- Produces: every route except `/login` and static assets redirects to `/login` when `portfolio_session` is missing or invalid. This is the last Foundation task that touches auth — Tasks 7-12 assume every request reaching a page is already authenticated.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/proxy.test.ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- __tests__/proxy.test.ts`
Expected: FAIL — `Cannot find module '../proxy'`

- [ ] **Step 3: Implement `proxy.ts`**

```ts
// proxy.ts
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- __tests__/proxy.test.ts`
Expected: 2 passed, 2 total

- [ ] **Step 5: Commit**

```bash
git add proxy.ts __tests__/proxy.test.ts
git commit -m "feat: gate all routes behind the passcode session via proxy.ts"
```

---

### Task 7: Google Sheets client

**Files:**
- Create: `lib/sheets/client.ts`

**Interfaces:**
- Consumes: `process.env.GOOGLE_SHEET_ID`, `process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL`, `process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- Produces: `fetchRange(range: string): Promise<string[][]>`. Task 10's `lib/sheets/fetch.ts` is the only consumer.

- [ ] **Step 1: Install googleapis**

```bash
npm install googleapis
```

- [ ] **Step 2: Implement the client**

There is no test for this file: it requires live service-account credentials that don't exist in this environment. It stays a thin wrapper so `lib/sheets/fetch.ts` (Task 10) can mock it easily.

```ts
// lib/sheets/client.ts
import 'server-only'
import { google } from 'googleapis'

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!email || !key) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY must be set'
    )
  }

  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

export async function fetchRange(range: string): Promise<string[][]> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is not set')
  }

  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  return (response.data.values as string[][] | undefined) ?? []
}
```

- [ ] **Step 3: Confirm it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json lib/sheets/client.ts
git commit -m "feat: add Google Sheets API client wrapper"
```

---

### Task 8: Sheet domain types

**Files:**
- Create: `lib/sheets/types.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `Holding`, `TradeLogEntry`, `WatchlistItem`, `EarningsRow`, `OutlookRow`, `PortfolioSummary` — every parser in Task 9 returns one of these; every fetch function in Task 10 returns arrays/instances of these.

- [ ] **Step 1: Define the types**

```ts
// lib/sheets/types.ts
export interface Holding {
  ticker: string
  name: string
  broker: 'IBKR' | 'MooMoo' | 'SG'
  sector?: string
  status: 'Held' | 'Watchlist'
  shares: number | null
  avgCost: number | null
  lastPrice: number | null
  marketValue: number | null
  unrealizedPnl: number | null
  unrealizedPnlPct: number | null
  targetPct: number | null
  currency: 'USD' | 'SGD'
}

export interface TradeLogEntry {
  date: string
  ticker: string
  company: string
  side: 'BUY' | 'SELL'
  shares: number
  price: number
  netAmount: number
  orderType: string
  commission: number
}

export interface WatchlistItem {
  ticker: string
  company: string
  status: 'Held' | 'Watchlist'
}

export interface EarningsRow {
  ticker: string
  period: string
  epsActual: number | null
  epsEstimate: number | null
  epsBeatMiss: number | null
  revenueActual: string
  revenueEstimate: string
  revenueBeatMiss: string
  guidance: string
  nextEarningsDate: string | null
}

export interface OutlookRow {
  ticker: string
  netMarginTtm: string
  freeCashFlowTtm: string
  managementOutlook: string
}

export interface PortfolioSummary {
  totalInvestedUsd: number
  marketValueUsd: number
  unrealizedPnlUsd: number
  unrealizedPnlPctUsd: number
  totalInvestedSgd: number
  currentValueSgd: number
  unrealizedPnlSgd: number
  unrealizedPnlPctSgd: number
}
```

- [ ] **Step 2: Confirm it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/sheets/types.ts
git commit -m "feat: add typed domain models for parsed sheet data"
```

---

### Task 9: Parsing layer (`lib/sheets/parse.ts`)

This is the DRY boundary the spec calls out: every messy raw-row quirk (merged section headers, blank spacer rows, subtotal rows, `"—"` for empty numbers) gets normalized here, once, so no UI component ever touches raw spreadsheet shape.

**Files:**
- Create: `lib/sheets/parse.ts`
- Test: `lib/sheets/__tests__/parse.test.ts`

**Interfaces:**
- Consumes: `Holding`, `TradeLogEntry`, `WatchlistItem`, `EarningsRow`, `OutlookRow`, `PortfolioSummary` from `lib/sheets/types.ts` (Task 8)
- Produces: `parseNumber`, `parseIbkrHoldings`, `parseMoomooHoldings`, `parseSgHoldings`, `parseWatchlist`, `parseTradeLog`, `parseEarnings`, `parseOutlook`, `parseOverviewSummary` — Task 10's fetch functions are the only consumers, one parser per tab.

- [ ] **Step 1: Write the failing test for `parseNumber`**

```ts
// lib/sheets/__tests__/parse.test.ts
import { parseNumber } from '../parse'

describe('parseNumber', () => {
  it('parses plain numbers', () => {
    expect(parseNumber('338.00')).toBe(338)
  })

  it('strips thousands separators', () => {
    expect(parseNumber('1,014.90')).toBe(1014.9)
  })

  it('strips percent signs', () => {
    expect(parseNumber('7.63%')).toBeCloseTo(7.63)
  })

  it('strips dollar signs', () => {
    expect(parseNumber('$56,091.00')).toBe(56091)
  })

  it('treats an em-dash as null', () => {
    expect(parseNumber('—')).toBeNull()
  })

  it('treats an empty string as null', () => {
    expect(parseNumber('')).toBeNull()
  })

  it('treats undefined as null', () => {
    expect(parseNumber(undefined)).toBeNull()
  })

  it('parses negative numbers', () => {
    expect(parseNumber('-6.55%')).toBeCloseTo(-6.55)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- lib/sheets/__tests__/parse.test.ts`
Expected: FAIL — `Cannot find module '../parse'`

- [ ] **Step 3: Implement `parseNumber`**

```ts
// lib/sheets/parse.ts
import type {
  Holding,
  TradeLogEntry,
  WatchlistItem,
  EarningsRow,
  OutlookRow,
  PortfolioSummary,
} from './types'

export function parseNumber(cell: string | undefined): number | null {
  if (!cell) return null
  const trimmed = cell.trim()
  if (trimmed === '' || trimmed === '—' || trimmed === '-') return null
  const cleaned = trimmed.replace(/[$,%]/g, '')
  const value = Number(cleaned)
  return Number.isNaN(value) ? null : value
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- lib/sheets/__tests__/parse.test.ts`
Expected: 8 passed, 8 total

- [ ] **Step 5: Write the failing test for `parseIbkrHoldings`**

Add to `lib/sheets/__tests__/parse.test.ts`:

```ts
import { parseIbkrHoldings } from '../parse'

describe('parseIbkrHoldings', () => {
  const rows = [
    ['', 'MEGA-CAP', '', '', '', '', '', '', '', '', '', '', '30%'],
    ['1', 'Mega-cap', 'GOOG', 'Alphabet Inc.', 'Stock', 'Held', '3', '338.00', '338.30', '1,014.90', '0.9', '0.09%', '10%'],
    ['2', 'Mega-cap', 'MSFT', 'Microsoft', 'Stock', 'Watchlist', '—', '—', '—', '—', '—', '—', '10%'],
    ['', '', '', '', '', '', '', '', '', '', '', '', ''],
  ]

  it('skips section header and blank rows, keeping only numbered data rows', () => {
    expect(parseIbkrHoldings(rows)).toHaveLength(2)
  })

  it('parses a held position', () => {
    const [held] = parseIbkrHoldings(rows)
    expect(held).toEqual({
      ticker: 'GOOG',
      name: 'Alphabet Inc.',
      broker: 'IBKR',
      sector: 'Mega-cap',
      status: 'Held',
      shares: 3,
      avgCost: 338,
      lastPrice: 338.3,
      marketValue: 1014.9,
      unrealizedPnl: 0.9,
      unrealizedPnlPct: 0.09,
      targetPct: 10,
      currency: 'USD',
    })
  })

  it('parses a watchlist position with null financial fields', () => {
    const [, watchlist] = parseIbkrHoldings(rows)
    expect(watchlist.status).toBe('Watchlist')
    expect(watchlist.shares).toBeNull()
    expect(watchlist.marketValue).toBeNull()
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test -- lib/sheets/__tests__/parse.test.ts`
Expected: FAIL — `parseIbkrHoldings is not a function`

- [ ] **Step 7: Implement `parseIbkrHoldings`**

Add to `lib/sheets/parse.ts`:

```ts
export function parseIbkrHoldings(rows: string[][]): Holding[] {
  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const [
        ,
        sector,
        ticker,
        name,
        ,
        status,
        shares,
        avgCost,
        lastPrice,
        marketValue,
        unrealizedPnl,
        unrealizedPnlPct,
        targetPct,
      ] = row
      return {
        ticker: ticker.trim(),
        name: name.trim(),
        broker: 'IBKR',
        sector: sector?.trim() || undefined,
        status: status?.trim() === 'Held' ? 'Held' : 'Watchlist',
        shares: parseNumber(shares),
        avgCost: parseNumber(avgCost),
        lastPrice: parseNumber(lastPrice),
        marketValue: parseNumber(marketValue),
        unrealizedPnl: parseNumber(unrealizedPnl),
        unrealizedPnlPct: parseNumber(unrealizedPnlPct),
        targetPct: parseNumber(targetPct),
        currency: 'USD',
      } satisfies Holding
    })
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npm test -- lib/sheets/__tests__/parse.test.ts`
Expected: 11 passed, 11 total

- [ ] **Step 9: Write the failing test for `parseMoomooHoldings`**

Add to the test file:

```ts
import { parseMoomooHoldings } from '../parse'

describe('parseMoomooHoldings', () => {
  const rows = [
    ['1', 'BOTZ', 'BOTZ', '11', '33.882', 'USD', '36.14', '397.54', '24.84', '6.66%'],
    ['', '', '', '', '', '', '', '', '', ''],
  ]

  it('parses a holding and skips blank rows', () => {
    const holdings = parseMoomooHoldings(rows)
    expect(holdings).toHaveLength(1)
    expect(holdings[0]).toEqual({
      ticker: 'BOTZ',
      name: 'BOTZ',
      broker: 'MooMoo',
      status: 'Held',
      shares: 11,
      avgCost: 33.882,
      lastPrice: 36.14,
      marketValue: 397.54,
      unrealizedPnl: 24.84,
      unrealizedPnlPct: 6.66,
      targetPct: null,
      currency: 'USD',
    })
  })
})
```

- [ ] **Step 10: Run it to verify it fails, then implement `parseMoomooHoldings`**

Run: `npm test -- lib/sheets/__tests__/parse.test.ts` (expect FAIL first)

Add to `lib/sheets/parse.ts`:

```ts
export function parseMoomooHoldings(rows: string[][]): Holding[] {
  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const [, ticker, , shares, avgCost, currency, currentPrice, marketValue, unrealizedPnl, unrealizedPnlPct] =
        row
      return {
        ticker: ticker.trim(),
        name: ticker.trim(),
        broker: 'MooMoo',
        status: 'Held',
        shares: parseNumber(shares),
        avgCost: parseNumber(avgCost),
        lastPrice: parseNumber(currentPrice),
        marketValue: parseNumber(marketValue),
        unrealizedPnl: parseNumber(unrealizedPnl),
        unrealizedPnlPct: parseNumber(unrealizedPnlPct),
        targetPct: null,
        currency: currency?.trim() === 'SGD' ? 'SGD' : 'USD',
      } satisfies Holding
    })
}
```

Then run `npm test -- lib/sheets/__tests__/parse.test.ts` again.
Expected: 12 passed, 12 total

- [ ] **Step 11: Write the failing test for `parseSgHoldings`**

Add to the test file:

```ts
import { parseSgHoldings } from '../parse'

describe('parseSgHoldings', () => {
  const rows = [
    ['1', 'FWD Insurance', 'Invest First Horizon', '4000', '5862.97', '1862.97', '46.57%'],
  ]

  it('parses a platform-based holding', () => {
    const holdings = parseSgHoldings(rows)
    expect(holdings).toEqual([
      {
        ticker: 'FWD Insurance',
        name: 'Invest First Horizon',
        broker: 'SG',
        status: 'Held',
        shares: null,
        avgCost: 4000,
        lastPrice: null,
        marketValue: 5862.97,
        unrealizedPnl: 1862.97,
        unrealizedPnlPct: 46.57,
        targetPct: null,
        currency: 'SGD',
      },
    ])
  })
})
```

- [ ] **Step 12: Run it to verify it fails, then implement `parseSgHoldings`**

Run: `npm test -- lib/sheets/__tests__/parse.test.ts` (expect FAIL first)

Add to `lib/sheets/parse.ts`:

```ts
export function parseSgHoldings(rows: string[][]): Holding[] {
  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const [, platform, product, invested, currentValue, unrealizedPnl, unrealizedPnlPct] = row
      return {
        ticker: platform.trim(),
        name: product.trim(),
        broker: 'SG',
        status: 'Held',
        shares: null,
        avgCost: parseNumber(invested),
        lastPrice: null,
        marketValue: parseNumber(currentValue),
        unrealizedPnl: parseNumber(unrealizedPnl),
        unrealizedPnlPct: parseNumber(unrealizedPnlPct),
        targetPct: null,
        currency: 'SGD',
      } satisfies Holding
    })
}
```

Then run `npm test -- lib/sheets/__tests__/parse.test.ts` again.
Expected: 13 passed, 13 total

- [ ] **Step 13: Write the failing test for `parseWatchlist`**

Add to the test file:

```ts
import { parseWatchlist } from '../parse'

describe('parseWatchlist', () => {
  const rows = [
    ['HELD POSITIONS', '', ''],
    ['GOOG', 'Alphabet Inc.', 'Held'],
    ['WATCHLIST POSITIONS', '', ''],
    ['MSFT', 'Microsoft Corp.', 'Watchlist'],
  ]

  it('skips section-label rows and keeps ticker rows', () => {
    expect(parseWatchlist(rows)).toEqual([
      { ticker: 'GOOG', company: 'Alphabet Inc.', status: 'Held' },
      { ticker: 'MSFT', company: 'Microsoft Corp.', status: 'Watchlist' },
    ])
  })
})
```

- [ ] **Step 14: Run it to verify it fails, then implement `parseWatchlist`**

Run: `npm test -- lib/sheets/__tests__/parse.test.ts` (expect FAIL first)

Add to `lib/sheets/parse.ts`:

```ts
export function parseWatchlist(rows: string[][]): WatchlistItem[] {
  return rows
    .filter((row) => row[0]?.trim() && row[1]?.trim())
    .map((row) => {
      const [ticker, company, status] = row
      return {
        ticker: ticker.trim(),
        company: company.trim(),
        status: status?.trim() === 'Held' ? 'Held' : 'Watchlist',
      } satisfies WatchlistItem
    })
}
```

Then run `npm test -- lib/sheets/__tests__/parse.test.ts` again.
Expected: 14 passed, 14 total

- [ ] **Step 15: Write the failing test for `parseTradeLog`**

Add to the test file:

```ts
import { parseTradeLog } from '../parse'

describe('parseTradeLog', () => {
  const rows = [
    ['1', '26 Aug 2026, 14:32', 'GOOG', 'Alphabet Inc. (Cl C)', 'BUY', '3', '338', '1014', 'Limit, Day', '0.00001'],
    ['', '', '', '', 'TOTAL', '', '', '3,239.00', '', '0.00018'],
  ]

  it('parses a trade and skips the TOTAL row', () => {
    expect(parseTradeLog(rows)).toEqual([
      {
        date: '26 Aug 2026, 14:32',
        ticker: 'GOOG',
        company: 'Alphabet Inc. (Cl C)',
        side: 'BUY',
        shares: 3,
        price: 338,
        netAmount: 1014,
        orderType: 'Limit, Day',
        commission: 0.00001,
      },
    ])
  })
})
```

- [ ] **Step 16: Run it to verify it fails, then implement `parseTradeLog`**

Run: `npm test -- lib/sheets/__tests__/parse.test.ts` (expect FAIL first)

Add to `lib/sheets/parse.ts`:

```ts
export function parseTradeLog(rows: string[][]): TradeLogEntry[] {
  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const [, dateTime, ticker, company, side, shares, price, netAmount, orderType, commission] = row
      return {
        date: dateTime.trim(),
        ticker: ticker.trim(),
        company: company.trim(),
        side: side?.trim() === 'SELL' ? 'SELL' : 'BUY',
        shares: parseNumber(shares) ?? 0,
        price: parseNumber(price) ?? 0,
        netAmount: parseNumber(netAmount) ?? 0,
        orderType: orderType.trim(),
        commission: parseNumber(commission) ?? 0,
      } satisfies TradeLogEntry
    })
}
```

Note: the TOTAL row is skipped by the same `row[0]?.trim()` filter as section headers, since its first cell (the `#` column) is blank.

Then run `npm test -- lib/sheets/__tests__/parse.test.ts` again.
Expected: 15 passed, 15 total

- [ ] **Step 17: Write the failing test for `parseEarnings` and `parseOutlook`**

Add to the test file:

```ts
import { parseEarnings, parseOutlook } from '../parse'

describe('parseEarnings', () => {
  const rows = [
    [
      'GOOG', 'Q2 2026', '9.11', '2.87', '6.24', '4.00',
      '$119.80B', '$116.53B', '$3.27B', '9.0%',
      'AI/search strength; Cloud growth', '2026-10-28', '2.73',
    ],
  ]

  it('parses eps as numbers and keeps revenue as display strings', () => {
    expect(parseEarnings(rows)).toEqual([
      {
        ticker: 'GOOG',
        period: 'Q2 2026',
        epsActual: 9.11,
        epsEstimate: 2.87,
        epsBeatMiss: 6.24,
        revenueActual: '$119.80B',
        revenueEstimate: '$116.53B',
        revenueBeatMiss: '$3.27B',
        guidance: 'AI/search strength; Cloud growth',
        nextEarningsDate: '2026-10-28',
      },
    ])
  })
})

describe('parseOutlook', () => {
  const rows = [['GOOG', '~31.5%', '~$72B', 'AI is strengthening Search and YouTube.']]

  it('parses profitability and outlook text as-is', () => {
    expect(parseOutlook(rows)).toEqual([
      {
        ticker: 'GOOG',
        netMarginTtm: '~31.5%',
        freeCashFlowTtm: '~$72B',
        managementOutlook: 'AI is strengthening Search and YouTube.',
      },
    ])
  })
})
```

- [ ] **Step 18: Run it to verify it fails, then implement `parseEarnings` and `parseOutlook`**

Run: `npm test -- lib/sheets/__tests__/parse.test.ts` (expect FAIL first)

Add to `lib/sheets/parse.ts`:

```ts
export function parseEarnings(rows: string[][]): EarningsRow[] {
  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const [
        ticker,
        period,
        epsActual,
        epsEstimate,
        epsBeatMiss,
        ,
        revenueActual,
        revenueEstimate,
        revenueBeatMiss,
        ,
        guidance,
        nextEarningsDate,
      ] = row
      return {
        ticker: ticker.trim(),
        period: period.trim(),
        epsActual: parseNumber(epsActual),
        epsEstimate: parseNumber(epsEstimate),
        epsBeatMiss: parseNumber(epsBeatMiss),
        revenueActual: revenueActual?.trim() ?? '',
        revenueEstimate: revenueEstimate?.trim() ?? '',
        revenueBeatMiss: revenueBeatMiss?.trim() ?? '',
        guidance: guidance?.trim() ?? '',
        nextEarningsDate: nextEarningsDate?.trim() || null,
      } satisfies EarningsRow
    })
}

export function parseOutlook(rows: string[][]): OutlookRow[] {
  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const [ticker, netMarginTtm, freeCashFlowTtm, managementOutlook] = row
      return {
        ticker: ticker.trim(),
        netMarginTtm: netMarginTtm.trim(),
        freeCashFlowTtm: freeCashFlowTtm.trim(),
        managementOutlook: managementOutlook?.trim() ?? '',
      } satisfies OutlookRow
    })
}
```

Then run `npm test -- lib/sheets/__tests__/parse.test.ts` again.
Expected: 17 passed, 17 total

- [ ] **Step 19: Write the failing tests for `parseOverviewSummary`, including the schema-drift error**

Add to the test file:

```ts
import { parseOverviewSummary } from '../parse'

describe('parseOverviewSummary', () => {
  const rows = [
    ['Portfolio', 'Invested (USD)', 'Market Value (USD)', 'P&L (USD)', 'P&L %'],
    ['IBKR Portfolio', '14,676.45', '15,795.83', '1,119.39', '7.63%'],
    ['MooMoo Portfolio', '66,870.37', '75,147.22', '8,276.85', '12.38%'],
    ['', '', '', '', ''],
    ['TOTAL USD', '81,546.82', '90,943.05', '9,396.24', '11.52%'],
    ['', '', '', '', ''],
    ['Portfolio', 'Invested (SGD)', 'Current Value (SGD)', 'P&L (SGD)', 'P&L %'],
    ['SG Portfolio', '118,390.00', '126,809.14', '8,419.14', '7.11%'],
    ['', '', '', '', ''],
    ['TOTAL SGD', '118,390.00', '126,809.14', '8,419.14', '7.11%'],
  ]

  it('finds the TOTAL USD and TOTAL SGD rows regardless of position', () => {
    expect(parseOverviewSummary(rows)).toEqual({
      totalInvestedUsd: 81546.82,
      marketValueUsd: 90943.05,
      unrealizedPnlUsd: 9396.24,
      unrealizedPnlPctUsd: 11.52,
      totalInvestedSgd: 118390,
      currentValueSgd: 126809.14,
      unrealizedPnlSgd: 8419.14,
      unrealizedPnlPctSgd: 7.11,
    })
  })

  it('throws a clear error when the TOTAL USD row is missing (schema drift)', () => {
    const brokenRows = rows.filter((row) => row[0] !== 'TOTAL USD')
    expect(() => parseOverviewSummary(brokenRows)).toThrow(
      'Portfolio Overview sheet is missing a TOTAL USD or TOTAL SGD row'
    )
  })
})
```

- [ ] **Step 20: Run it to verify it fails, then implement `parseOverviewSummary`**

Run: `npm test -- lib/sheets/__tests__/parse.test.ts` (expect FAIL first)

Add to `lib/sheets/parse.ts`:

```ts
export function parseOverviewSummary(rows: string[][]): PortfolioSummary {
  const usdTotal = rows.find((row) => row[0]?.trim() === 'TOTAL USD')
  const sgdTotal = rows.find((row) => row[0]?.trim() === 'TOTAL SGD')

  if (!usdTotal || !sgdTotal) {
    throw new Error('Portfolio Overview sheet is missing a TOTAL USD or TOTAL SGD row')
  }

  return {
    totalInvestedUsd: parseNumber(usdTotal[1]) ?? 0,
    marketValueUsd: parseNumber(usdTotal[2]) ?? 0,
    unrealizedPnlUsd: parseNumber(usdTotal[3]) ?? 0,
    unrealizedPnlPctUsd: parseNumber(usdTotal[4]) ?? 0,
    totalInvestedSgd: parseNumber(sgdTotal[1]) ?? 0,
    currentValueSgd: parseNumber(sgdTotal[2]) ?? 0,
    unrealizedPnlSgd: parseNumber(sgdTotal[3]) ?? 0,
    unrealizedPnlPctSgd: parseNumber(sgdTotal[4]) ?? 0,
  }
}
```

Then run `npm test -- lib/sheets/__tests__/parse.test.ts` again.
Expected: 19 passed, 19 total

- [ ] **Step 21: Run the full parse test file one more time to confirm everything passes together**

Run: `npm test -- lib/sheets/__tests__/parse.test.ts`
Expected: 19 passed, 19 total

- [ ] **Step 22: Commit**

```bash
git add lib/sheets/parse.ts lib/sheets/__tests__/parse.test.ts
git commit -m "feat: add sheet parsing layer normalizing raw rows into domain models"
```

---

### Task 10: Cached fetch layer (`lib/sheets/fetch.ts`)

**Files:**
- Create: `lib/sheets/fetch.ts`
- Test: `lib/sheets/__tests__/fetch.test.ts`

**Interfaces:**
- Consumes: `fetchRange` from `lib/sheets/client.ts` (Task 7), all `parse*` functions from `lib/sheets/parse.ts` (Task 9)
- Produces: `getOverview()`, `getIbkrHoldings()`, `getMoomooHoldings()`, `getSgHoldings()`, `getWatchlist()`, `getTradeLog()`, `getEarnings()`, `getOutlook()` — all `async`, all tagged `cacheTag('portfolio')`. Task 12's page and refresh action are the consumers.

- [ ] **Step 1: Write the failing test using a mocked client**

```ts
// lib/sheets/__tests__/fetch.test.ts
jest.mock('../client', () => ({
  fetchRange: jest.fn(),
}))

import { fetchRange } from '../client'
import { getIbkrHoldings, getOverview } from '../fetch'

const mockedFetchRange = fetchRange as jest.MockedFunction<typeof fetchRange>

describe('getIbkrHoldings', () => {
  it('fetches the IBKR range and parses it', async () => {
    mockedFetchRange.mockResolvedValueOnce([
      ['1', 'Mega-cap', 'GOOG', 'Alphabet Inc.', 'Stock', 'Held', '3', '338.00', '338.30', '1,014.90', '0.9', '0.09%', '10%'],
    ])

    const holdings = await getIbkrHoldings()

    expect(mockedFetchRange).toHaveBeenCalledWith(expect.stringContaining('IBKR Portfolio'))
    expect(holdings).toHaveLength(1)
    expect(holdings[0].ticker).toBe('GOOG')
  })
})

describe('getOverview', () => {
  it('fetches the overview range and parses the totals', async () => {
    mockedFetchRange.mockResolvedValueOnce([
      ['TOTAL USD', '81,546.82', '90,943.05', '9,396.24', '11.52%'],
      ['TOTAL SGD', '118,390.00', '126,809.14', '8,419.14', '7.11%'],
    ])

    const overview = await getOverview()

    expect(overview.marketValueUsd).toBe(90943.05)
    expect(overview.currentValueSgd).toBe(126809.14)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- lib/sheets/__tests__/fetch.test.ts`
Expected: FAIL — `Cannot find module '../fetch'`

- [ ] **Step 3: Implement `lib/sheets/fetch.ts`**

The exact row ranges below assume the sheet's current layout (see the spec's tab table). If the sheet's row numbers shift, update these range strings — that's the one place they're allowed to drift, since `parseOverviewSummary` (Task 9) already guards the one row-position-independent lookup.

```ts
// lib/sheets/fetch.ts
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { fetchRange } from './client'
import {
  parseEarnings,
  parseIbkrHoldings,
  parseMoomooHoldings,
  parseOutlook,
  parseOverviewSummary,
  parseSgHoldings,
  parseTradeLog,
  parseWatchlist,
} from './parse'
import type {
  EarningsRow,
  Holding,
  OutlookRow,
  PortfolioSummary,
  TradeLogEntry,
  WatchlistItem,
} from './types'

export async function getOverview(): Promise<PortfolioSummary> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Portfolio Overview!A1:E20')
  return parseOverviewSummary(rows)
}

export async function getIbkrHoldings(): Promise<Holding[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('IBKR Portfolio!A36:M90')
  return parseIbkrHoldings(rows)
}

export async function getMoomooHoldings(): Promise<Holding[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Moo Moo Portfolio!A7:J20')
  return parseMoomooHoldings(rows)
}

export async function getSgHoldings(): Promise<Holding[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('SG Investments Portfolio!A6:G15')
  return parseSgHoldings(rows)
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Holdings!A2:C25')
  return parseWatchlist(rows)
}

export async function getTradeLog(): Promise<TradeLogEntry[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Trade Log!A2:J50')
  return parseTradeLog(rows)
}

export async function getEarnings(): Promise<EarningsRow[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Quarterly Results!A2:M20')
  return parseEarnings(rows)
}

export async function getOutlook(): Promise<OutlookRow[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Profitability & Outlook!A2:D20')
  return parseOutlook(rows)
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- lib/sheets/__tests__/fetch.test.ts`
Expected: 2 passed, 2 total

- [ ] **Step 5: Commit**

```bash
git add lib/sheets/fetch.ts lib/sheets/__tests__/fetch.test.ts
git commit -m "feat: add cached per-tab sheet fetch functions"
```

---

### Task 11: FX rate (`lib/fx.ts`)

**Files:**
- Create: `lib/fx.ts`
- Test: `lib/__tests__/fx.test.ts`

**Interfaces:**
- Consumes: `fetch` (global), Frankfurter's public API (`https://api.frankfurter.dev/v1/latest?base=USD&symbols=SGD`)
- Produces: `getUsdSgdRate(): Promise<number>`, tagged `cacheTag('fx-rate')` (separate from `'portfolio'` since it's an independent data source per the spec). Task 12's refresh action invalidates both tags.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/fx.test.ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- lib/__tests__/fx.test.ts`
Expected: FAIL — `Cannot find module '../fx'`

- [ ] **Step 3: Implement `lib/fx.ts`**

```ts
// lib/fx.ts
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'

interface FrankfurterResponse {
  amount: number
  base: string
  rates: Record<string, number>
}

export async function getUsdSgdRate(): Promise<number> {
  'use cache'
  cacheTag('fx-rate')
  cacheLife('portfolioData')

  const response = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=SGD')

  if (!response.ok) {
    throw new Error(`FX rate request failed with status ${response.status}`)
  }

  const data = (await response.json()) as FrankfurterResponse
  return data.rates.SGD
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- lib/__tests__/fx.test.ts`
Expected: 2 passed, 2 total

- [ ] **Step 5: Commit**

```bash
git add lib/fx.ts lib/__tests__/fx.test.ts
git commit -m "feat: add independent FX rate lookup with its own cache tag"
```

---

### Task 12: Refresh action and minimal authenticated home page

This is the task that proves the whole Foundation pipeline works end to end: login gates the app, the home page pulls real (or, without live credentials, at-least-mocked-shape) data through client → parse → fetch, and the refresh button invalidates the cache on demand.

**Files:**
- Create: `app/actions.ts`
- Modify: `app/page.tsx`
- Create: `app/refresh-button.tsx`

**Interfaces:**
- Consumes: `getOverview` from `lib/sheets/fetch.ts` (Task 10), `getUsdSgdRate` from `lib/fx.ts` (Task 11)
- Produces: `refreshPortfolioData(): Promise<void>` Server Action. This is the last Foundation task; the UI plan replaces `app/page.tsx` entirely with the full Overview tab, but reuses `refreshPortfolioData` and the `<RefreshButton>` component as-is.

- [ ] **Step 1: Write the refresh Server Action**

```ts
// app/actions.ts
'use server'

import { updateTag } from 'next/cache'

export async function refreshPortfolioData(): Promise<void> {
  updateTag('portfolio')
  updateTag('fx-rate')
}
```

- [ ] **Step 2: Write the refresh button Client Component**

```tsx
// app/refresh-button.tsx
'use client'

import { useTransition } from 'react'
import { refreshPortfolioData } from './actions'

export function RefreshButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => refreshPortfolioData())}
      className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
    >
      {isPending ? 'Refreshing…' : 'Refresh'}
    </button>
  )
}
```

- [ ] **Step 3: Replace the home page with a minimal authenticated summary**

```tsx
// app/page.tsx
import { Suspense } from 'react'
import { getOverview } from '@/lib/sheets/fetch'
import { getUsdSgdRate } from '@/lib/fx'
import { RefreshButton } from './refresh-button'

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Portfolio</h1>
        <RefreshButton />
      </div>
      <Suspense fallback={<p>Loading…</p>}>
        <Summary />
      </Suspense>
    </main>
  )
}

async function Summary() {
  const [overview, fxRate] = await Promise.all([getOverview(), getUsdSgdRate()])

  return (
    <dl className="grid grid-cols-2 gap-4">
      <div>
        <dt className="text-sm text-gray-500">USD/SGD</dt>
        <dd className="text-lg font-medium">{fxRate.toFixed(3)}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-500">Market value (USD)</dt>
        <dd className="text-lg font-medium">${overview.marketValueUsd.toLocaleString()}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-500">Unrealized P&amp;L (USD)</dt>
        <dd className="text-lg font-medium">${overview.unrealizedPnlUsd.toLocaleString()}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-500">Current value (SGD)</dt>
        <dd className="text-lg font-medium">S${overview.currentValueSgd.toLocaleString()}</dd>
      </div>
    </dl>
  )
}
```

- [ ] **Step 4: Confirm it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Manual verification (requires real credentials — cannot be automated in this environment)**

This step needs a real `.env.local` filled in from `.env.local.example` (Task 3): a real `GOOGLE_SHEET_ID`, a service account sharing the Sheet as Viewer, and an `APP_PASSCODE`/`SESSION_SECRET`. With those in place:

1. Run: `npm run dev`
2. Visit `http://localhost:3000` — expect a redirect to `/login`.
3. Enter the wrong passcode — expect the "Incorrect passcode" error.
4. Enter the correct passcode — expect a redirect to `/`, showing the FX rate and portfolio totals pulled live from the Sheet.
5. Click "Refresh" — expect no error and (if the underlying sheet data changed) updated numbers on the next load.

Record the result of this manual check in the task's completion notes; it cannot be asserted by an automated test in this environment.

- [ ] **Step 6: Commit**

```bash
git add app/actions.ts app/page.tsx app/refresh-button.tsx
git commit -m "feat: wire up authenticated home page with live data and manual refresh"
```

---

### Task 13: Project `CLAUDE.md`

**Files:**
- Create: `CLAUDE.md` (this repo's existing `CLAUDE.md` currently only contains `@AGENTS.md` — extend it, don't replace the `@AGENTS.md` reference)

**Interfaces:**
- Consumes: nothing (documentation only)
- Produces: durable conventions for whoever picks up the UI plan next.

- [ ] **Step 1: Read the current file**

Run: `cat CLAUDE.md`
Expected: a single line, `@AGENTS.md`.

- [ ] **Step 2: Extend it with project conventions**

```markdown
@AGENTS.md

# Portfolio Dashboard

A password-gated, mobile-first PWA showing personal investment data sourced
from a private Google Sheet. Spec: `docs/superpowers/specs/2026-08-28-portfolio-dashboard-design.md`.
Foundation plan: `docs/superpowers/plans/2026-08-28-portfolio-foundation.md`.

## Conventions

- **Parsing is centralized.** `lib/sheets/parse.ts` is the only place that
  understands raw spreadsheet row shape (merged section headers, blank
  spacer rows, `"—"` for empty numbers). Every UI component works with the
  typed models in `lib/sheets/types.ts` — never raw `string[][]` rows. If a
  new sheet tab is added, add one parser function here, not ad hoc parsing
  in a component.
- **Caching follows Cache Components.** Every sheet/FX fetch function is
  `'use cache'` + `cacheTag('portfolio')` (or `'fx-rate'` for `lib/fx.ts`) +
  `cacheLife('portfolioData')` (the custom profile in `next.config.ts`:
  5 min stale / 30 min revalidate / 2 hr expire).
- **"Refresh" means re-pull the Google Sheet, nothing more.** The refresh
  Server Action (`app/actions.ts`) calls `updateTag('portfolio')` and
  `updateTag('fx-rate')`. It does not and cannot trigger the IBKR-to-Sheet
  sync — that's a separate automation outside this app, only reachable from
  a Claude agent session with the IBKR MCP, not from a deployed web server.
- **Auth is a single shared passcode**, not a user system. `proxy.ts` checks
  an `iron-session`-sealed `portfolio_session` cookie set by
  `app/login/actions.ts`. There is no user table.
- **This Next.js version (16.3.3) breaks from older training data.** Two
  load-bearing examples: `middleware.js` is renamed `proxy.js` (exported
  function `proxy`, not `middleware`); caching uses Cache Components
  (`use cache`/`cacheLife`/`cacheTag`/`updateTag`), not legacy
  `revalidate`/ISR config. Check `node_modules/next/dist/docs/` before
  assuming an older Next.js pattern still applies.
- **This directory is inside a larger shared git repo** with many unrelated
  projects and their own pending changes. Never `git add -A` / `git add .`
  here — always add explicit file paths relative to `/workspace/portfolio`.

## What's next

The UI plan (to be written) builds the 5 nav tabs (Overview, Watchlist,
Research, Trade Log, Performance) on top of this foundation, using a DRY
`<DataTable>` / `<StatCard>` / `<AllocationChart>` component core (shadcn/ui
+ Recharts). `app/page.tsx`'s minimal summary from this plan gets replaced
by the full Overview tab; `refreshPortfolioData` and `<RefreshButton>` are
reused as-is.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document Foundation conventions in CLAUDE.md"
```

---

## Self-Review Notes

- **Spec coverage:** access control (Tasks 4-6), Google Sheets data access (Tasks 7-10), refresh semantics (Task 12), FX source (Task 11), CLAUDE.md deliverable (Task 13) are all covered. UI/IA, visual design, and PWA manifest are explicitly deferred to the follow-up UI plan per the two-plan split agreed with the user.
- **Type consistency:** `Holding`, `TradeLogEntry`, `WatchlistItem`, `EarningsRow`, `OutlookRow`, `PortfolioSummary` are defined once in Task 8 and used with identical field names through Tasks 9-12 — checked field-by-field against the parse tests.
- **No placeholders:** every step has runnable code; the one manual-only step (Task 12, Step 5) is explicitly labeled as such with a reason (no live credentials in this environment), not left vague.
