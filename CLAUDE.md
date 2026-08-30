@AGENTS.md

# Portfolio Dashboard

A password-gated, mobile-first PWA showing personal investment data sourced
from a private Google Sheet. Spec: `docs/superpowers/specs/2026-08-28-portfolio-dashboard-design.md`.
Foundation plan: `docs/superpowers/plans/2026-08-28-portfolio-foundation.md`.

## Conventions

- **Parsing is centralized.** `lib/sheets/parse.ts` is the only place that
  understands raw spreadsheet row shape (merged section headers, blank
  spacer rows, `"—"` for empty numbers, trailing `TOTALS` / `NOTES` blocks).
  Every UI component works with the typed models in `lib/sheets/types.ts` —
  never raw `string[][]` rows. If a new sheet tab is added, add one parser
  function here, not ad hoc parsing in a component.
- **A row is "data" only if its `#` column is a positive integer.**
  `parseIbkr/Moomoo/Sg/TradeLog` filter on `isNumberedRow(row[0])`;
  `parseWatchlist` filters on a valid `Held`/`Watchlist` status. This is what
  keeps section headers, spacers, and `TOTALS`/`NOTES` out — fetch ranges in
  `lib/sheets/fetch.ts` are deliberately wider than the current data and lean
  on this filter rather than on exact row numbers.
- **The sheet's real tab names are not the spec's labels.** Actual tabs:
  `Overview`, `IBKR Portfolio`, `Moo Moo Portfolio`, `SG Portfolio`,
  `Earnings` (which actually holds the Held/Watchlist ticker list, *not*
  quarterly earnings), `Trade Log`. There is no earnings/EPS or profitability
  data in the sheet — the Research tab is a "coming soon" stub until such a
  tab exists.
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

## UI conventions

- **Column defs live inside Client Component wrappers, not passed as props.**
  `HoldingsTable`/`TradeLogTable`/`WatchlistTable` (`components/`) each define
  their own `ColumnDef[]` and wrap the generic `<DataTable>`
  (`components/data-table.tsx`). Functions (like column `cell` renderers)
  cannot cross the Server→Client Component prop boundary, so pages only ever
  pass plain typed arrays (`Holding[]`, etc.) into these wrappers — never
  columns.
- **All data-shaping is a pure function, not component logic.**
  `lib/aggregate.ts` (sector/broker aggregation) is a plain, fully
  unit-tested module consumed by Server Component pages. If a new chart or
  summary needs reshaped data, add a function there first, not inline in a
  component.
- **The Tabs primitive is hand-wired against `@radix-ui/react-tabs`**
  (`components/ui/tabs.tsx`), not generated via the shadcn CLI — the CLI's
  interactive init prompts don't work under automated execution. If more
  shadcn-style primitives are needed later, follow the same pattern
  (headless Radix + Tailwind classes matching shadcn's conventions) rather
  than running `npx shadcn@latest init`.
- **`@tanstack/react-table` is pinned to v8.** v9 is a from-scratch API
  rewrite (`useTable`/`createCoreRowModel`/`tableFeatures` instead of
  `useReactTable`/`getCoreRowModel`); `<DataTable>` is written against v8.
- **`app/(dashboard)/` is a route group**, not a URL segment — `/`,
  `/watchlist`, `/research`, `/trade-log`, `/performance` all live there and
  share `app/(dashboard)/layout.tsx`'s nav shell. `/login` deliberately sits
  outside the group so it never renders the nav. `Research` and `Performance`
  are coming-soon stubs and are marked `disabled` in `components/nav.tsx`.
- **Dashboard pages fetch inside a `<Suspense>` boundary after `connection()`.**
  Every page's data-fetching subcomponent calls `await connection()` before
  the `'use cache'` fetch functions so the build never prerenders the route
  against live-only Google credentials; the fetch results still cache
  normally per request.
