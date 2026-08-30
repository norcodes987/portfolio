# Portfolio Dashboard PWA — Design Spec

Date: 2026-08-28

## Purpose

A mobile-first, installable PWA that displays the user's personal investment
portfolio (net worth, holdings across three brokers, a watchlist, trade
history, and lightweight research notes), sourced from a private Google
Sheet. This is a personal finance dashboard, not a career/resume portfolio.

Reference: sample UI at `portfilio_sample_ui.png` (dark sidebar, light
content, summary cards, holdings table with sub-tabs, sector donut, weight
bars, bottom-of-list "Performance — Soon").

## Source data

Google Sheet (ID `1R3ui_yx5GVo1cCTDvckdR6YBJT-vsI9LkfPyO_TqrrQ`), read via the
Google Sheets API with a read-only service account — **never** published to
the web. Tabs in the sheet (names as they appear on the live sheet, verified
2026-08-30) and how they map to the app:

| Sheet tab | Contains | App surface |
|---|---|---|
| `Overview` | USD/SGD portfolio totals (`TOTAL USD` / `TOTAL SGD` rows), notes | Overview summary cards |
| `IBKR Portfolio` | Sector-grouped holdings, shares/cost/price/P&L, target % | Overview holdings table (IBKR sub-tab), sector donut, weight bars |
| `Moo Moo Portfolio` | Holdings (ticker, shares, cost, price, P&L) | Overview holdings table (MooMoo sub-tab) |
| `SG Portfolio` | Platform-based holdings (insurance/robo/broker products) | Overview holdings table (SG sub-tab) |
| `Earnings` | *Despite the name:* the Held/Watchlist ticker/company/status list | Watchlist tab |
| `Trade Log` | Executed trades (date, ticker, side, shares, price, commission) | Trade Log tab |

The sheet has no historical time-series data — only current snapshots — and
**no quarterly-earnings or profitability data at all**. The originally
planned `Quarterly Results` and `Profitability & Management Outlook` tabs do
not exist, so the **Research** tab ships as a "Coming soon" stub alongside
**Performance** until such a tab is added (see Out of scope).

## Access control

Single-user, password-gated. Next.js Middleware checks a signed httpOnly
cookie on every route except `/login`. The cookie is issued by a Server
Action that compares a submitted passcode against an env-var secret
(`APP_PASSCODE`) and seals the cookie with `iron-session` (matching the
pattern in the Next.js 16 Cache Components auth guide) so it can't be
forged. No user table, no external auth provider (Clerk, etc.) — this is
intentionally minimal for a single user.

## Architecture

- Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui
  (already scaffolded in this repo).
- `cacheComponents: true` in `next.config.ts` (Next 16 Cache Components —
  `use cache`, `cacheLife`, `cacheTag`/`updateTag`). This project's Next
  version has breaking changes from older Next docs/training data; consult
  `node_modules/next/dist/docs/` before writing caching or auth code.
- Data source library (`lib/sheets/`): `googleapis` package, read-only scope
  (`spreadsheets.readonly`), service-account credentials via env vars
  (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`). The
  sheet must be shared with the service account's email as Viewer.
- One fetch function per logical tab in `lib/sheets/fetch.ts`
  (`getOverview`, `getIbkrHoldings`, `getMoomooHoldings`, `getSgHoldings`,
  `getWatchlist`, `getTradeLog`, `getEarnings`, `getOutlook`), each marked
  `'use cache'` with `cacheTag('portfolio')` and a shared custom cache
  profile defined in `next.config.ts`:
  `{ stale: 300, revalidate: 1800, expire: 7200 }` (5 min / 30 min / 2 hr).
- Parsing layer (`lib/sheets/parse.ts`): raw sheet rows are messy (merged
  section headers, spacer rows, per-section subtotal rows). This module is
  the **single DRY boundary** that converts raw rows into typed domain
  models (`Holding`, `TradeLogEntry`, `WatchlistItem`, `EarningsRow`,
  `OutlookRow`). UI components only ever see these typed models, never raw
  spreadsheet shape. Parsing functions validate expected headers and throw a
  clear error on schema drift rather than silently mis-mapping columns.
- FX rate (`lib/fx.ts`): independent `'use cache'` call to a free FX API
  (Frankfurter), `cacheLife('minutes')`-equivalent — not sourced from the
  sheet.
- Refresh button: a Server Action calls `updateTag('portfolio')` (and
  re-fetches FX), invalidating the cache on demand. **Refresh means
  "re-pull the Google Sheet now, bypassing the app's cache" — nothing more.**
  It does not and cannot trigger the IBKR-to-Sheet sync (that automation runs
  outside this app, via a separately scheduled process using the IBKR MCP,
  which is only reachable from a Claude agent session, not a deployed web
  server). The Overview header shows the sheet's own "last synced" timestamp
  from the Portfolio Overview tab so staleness of the upstream IBKR sync is
  visible without the app needing to trigger it.
- Deployment: Vercel. Secrets (service account key, passcode secret) managed
  via `vercel env`.

## Information architecture

Nav tabs (bottom bar on mobile, sidebar on desktop — 5 items, within the
recommended ≤5 for bottom nav):

1. **Overview** — FX rate + last-sync header, summary cards (net worth,
   USD/SGD totals, unrealized P&L), per-broker breakdown blocks, holdings
   table with sub-tabs (All/IBKR/MooMoo/SG), sector-allocation donut,
   portfolio-weight bars.
2. **Watchlist** — table of tracked-but-not-held tickers.
3. **Research** — *intended* as per-ticker cards combining quarterly earnings
   and profitability/outlook text; ships as a disabled nav item + "Coming
   soon" placeholder in v1 because the source sheet has no such data.
4. **Trade Log** — chronological table of executed trades.
5. **Performance** — disabled nav item, "Coming Soon" placeholder (no
   historical data exists yet — see Out of scope).

### Component structure (DRY core)

- `<DataTable>` — generic TanStack-Table-backed table (shadcn pattern),
  driven by column-def configs per data type. Reused across IBKR/MooMoo/SG
  holdings, Watchlist, and Trade Log instead of one bespoke table per tab.
- `<StatCard>` — reused for all summary-card metrics.
- `<AllocationChart>` — Recharts donut, ≤6 categories, largest slice at 12
  o'clock, always labeled with %, with a text/table fallback for
  accessibility (donuts fail WCAG color-only checks).
- `<WeightBars>` — horizontal bar list, values always visible as text (not
  hover-only).

## Visual design

Ground truth is the sample screenshot, not a generic dashboard default:

- Dark slate sidebar (desktop) / bottom tab bar (mobile); light,
  high-contrast content area for data density.
- Teal/emerald accent; semantic green for gains, red for losses — always
  paired with `+`/`-` and `%` text, never color-alone.
- Tabular-figure numerals (`font-variant-numeric: tabular-nums`) so table
  columns of prices/shares align.
- Touch targets ≥44×44px, ≥8px spacing (mobile UX baseline).
- PWA: manifest.json + icons for installability, standalone display mode.
  No offline caching of financial data (installable but online-only, per
  decision to avoid persisting financial data in browser storage).

## Error handling

- Sheets API failures (quota, network, malformed row): each tab's fetch is
  isolated behind its own `Suspense` boundary; a broken tab shows an inline
  "couldn't load this data" card instead of crashing the page.
- FX API failure: falls back to the last successfully cached rate with a
  visible "stale rate" indicator.
- Auth: invalid/expired passcode cookie → middleware redirect to `/login`.
- Sheet schema drift: parsing functions validate expected headers and throw
  a clear, loggable error.

## Testing

- Unit tests (Jest, already in this repo) for `lib/sheets/parse.ts` using
  fixture data captured from the real sheet's row shape — this is the
  highest-value target since it's pure functions normalizing the messiest
  part of the system.
- Component tests for `<DataTable>`, `<StatCard>`, `<AllocationChart>` with
  mock data.
- Auth middleware gets a focused unit test (valid/invalid/missing cookie).
- No e2e tests against the live Google Sheet in CI (would require live
  credentials in CI).

## Out of scope (v1)

- Historical performance charting (no time-series data exists yet; the
  Performance tab is a static "Coming Soon" placeholder).
- Triggering the IBKR-to-Sheet sync from the app.
- Multi-user auth, roles, or an external auth provider.
- Offline data caching (installable PWA, but online-only).

## Deliverables

- Working Next.js app implementing the above.
- `CLAUDE.md` documenting this project's conventions for future sessions:
  the parsing-layer DRY boundary, the Cache Components caching/refresh
  pattern, the "refresh re-pulls the sheet only" rule, and pointers to
  `node_modules/next/dist/docs/` for this Next version's breaking changes.
