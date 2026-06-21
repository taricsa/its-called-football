# It's Called Football

A satirical Next.js site making the case that the game is called **football**, not soccer. Traffic is split A/B between two visual layouts: a formal **International Court of Football Justice** theme and a chaotic **Meme** theme.

**Live repo:** [github.com/taricsa/its-called-football](https://github.com/taricsa/its-called-football)

## Features

- **A/B theme split** — Server-side flag evaluation routes visitors to `CourtTheme` or `MemeTheme` via the [Flags SDK v4](https://flags-sdk.dev/).
- **US geo-gating** — Visitors from the US (or `?us=true` locally) must pass a rigged **Metric Literacy Quiz** before accessing the site.
- **Global Counter** — Live odometer ticking past 4.5 billion "linguistically compliant" humans.
- **Translation Matrix** — Etymological evidence from around the world (with a Japanese easter egg).
- **Court theme** — Bureaucratic petition form, document rectification tool, and legal transcript styling.
- **Meme theme** — Slang filter, American travel apology generator, and a countdown to the year 3000.
- **WC2026 probabilities** — Live Monte Carlo win chances at `/wc2026`, refreshed from API-Football (every ~2 min on page load; optional Vercel Cron on Pro).

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, Server Components)
- [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Flags SDK v4](https://www.npmjs.com/package/flags) for feature flags and Vercel Toolbar integration

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Environment

Create `.env.local` at the project root with a `FLAGS_SECRET` value. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

This secret is required for the Flags SDK to evaluate flags and support Vercel Toolbar overrides. Use a separate value per environment (development, preview, production) when deploying.

For live WC2026 probabilities, add:

| Variable | Required | Description |
|----------|----------|-------------|
| `API_FOOTBALL_KEY` | Production | API key from [api-football.com](https://www.api-football.com/) for live scores |
| `CRON_SECRET` | Optional | Secures `/api/cron/wc2026-sync` when using Vercel Cron or an external scheduler |

Without `API_FOOTBALL_KEY`, `/wc2026` falls back to pre-tournament projections using static Elo ratings.

#### Live update strategy

On **all plans**, `/wc2026` fetches fresh scores from API-Football every ~2 minutes when the page is loaded (server-side cache).

On **Vercel Hobby**, [cron jobs are limited to once per day](https://vercel.com/docs/cron-jobs/usage-and-pricing) — a `*/5 * * * *` schedule will fail deployment. No `vercel.json` cron is included by default.

On **Vercel Pro**, rename `vercel.pro.example.json` to `vercel.json` to enable automatic polling every 5 minutes via Vercel Cron.

Alternatively, point any external cron service (e.g. [cron-job.org](https://cron-job.org)) at `GET /api/cron/wc2026-sync` with `Authorization: Bearer $CRON_SECRET`.

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will land in either the Court or Meme layout depending on the `theme-variant` flag (50/50 by default).

### Local testing

| URL | Effect |
|-----|--------|
| `http://localhost:3000` | Normal visit; court or meme via flag |
| `http://localhost:3000?us=true` | Simulates US geo-block; triggers metric quiz lockout |
| `http://localhost:3000/wc2026` | World Cup 2026 win probabilities |
| `http://localhost:3000/api/cron/wc2026-sync` | Manual sync trigger (dev only without `CRON_SECRET`) |

Use the **Vercel Toolbar Flags Explorer** (on preview/production deployments) to override `theme-variant` between `court` and `meme` without redeploying.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
  page.tsx                          # Server entry: geo-gate + theme routing
  .well-known/vercel/flags/route.ts # Flags SDK discovery endpoint
  globals.css                       # Tailwind v4 + animation utilities
components/
  blocker/MetricQuizModal.tsx       # US metric literacy quiz lockout
  court/CourtTheme.tsx              # Page A: bureaucratic court layout
  meme/MemeTheme.tsx                # Page B: chaotic meme layout
  shared/
    GlobalCounter.tsx               # Live population odometer
    TranslationMatrix.tsx           # Global etymology table/grid
flags.ts                            # theme-variant flag definition
types/theme.ts                      # ThemeVariant = 'court' | 'meme'
```

## Deploy on Vercel

1. Import the repository into [Vercel](https://vercel.com).
2. Add `FLAGS_SECRET` as a sensitive environment variable for Preview and Production.
3. Add `API_FOOTBALL_KEY` for live tournament updates on `/wc2026`.
4. Deploy — the flags discovery endpoint at `/.well-known/vercel/flags` enables Toolbar integration automatically. On Pro, add `vercel.json` from `vercel.pro.example.json` for hands-off cron polling.

## License

Private project.
