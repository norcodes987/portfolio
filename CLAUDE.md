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
