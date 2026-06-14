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
3. Deploy — the flags discovery endpoint at `/.well-known/vercel/flags` enables Toolbar integration automatically.

## License

Private project.
