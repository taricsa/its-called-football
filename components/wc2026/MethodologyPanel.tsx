'use client';

import { useState } from 'react';
import type { ThemeVariant } from '@/types/theme';

type MethodologyPanelProps = {
  variant: ThemeVariant;
};

export default function MethodologyPanel({ variant }: MethodologyPanelProps) {
  const [open, setOpen] = useState(false);
  const isCourt = variant === 'court';

  return (
    <div
      className={
        isCourt
          ? 'rounded-xl border border-zinc-200 bg-white shadow-sm'
          : 'rounded-2xl border border-zinc-800 bg-zinc-900'
      }
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={
          isCourt
            ? 'flex w-full items-center justify-between px-4 py-3 text-left font-sans text-xs font-bold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-900'
            : 'flex w-full items-center justify-between px-4 py-3 text-left font-mono text-xs font-black uppercase tracking-wider text-zinc-400 transition hover:text-white'
        }
      >
        <span>
          {isCourt
            ? 'Inspect Methodology (Court Order §2026-Prob)'
            : 'How This Math Works (Read It, Nerd)'}
        </span>
        <span>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div
          className={
            isCourt
              ? 'space-y-3 border-t border-zinc-100 px-4 py-4 font-sans text-xs leading-relaxed text-zinc-600'
              : 'space-y-3 border-t border-zinc-800 px-4 py-4 font-mono text-xs leading-relaxed text-zinc-400'
          }
        >
          {isCourt ? (
            <>
              <p>
                When live, a Vercel Cron job polls API-Football every five
                minutes. Finished matches are applied as fixed results; only
                remaining fixtures are simulated randomly.
              </p>
              <p>
                Match outcomes derive from standard Elo win probabilities. Group
                matches permit draws; knockout matches do not. The top two teams
                per group plus the eight best third-placed teams advance.
              </p>
              <p>
                Satirical Elo adjustments are applied before simulation: +15 for
                correct football terminology, +10 for host nations, −50 Hand-Egg
                Confusion Penalty for the United States, and −15 for Japan&apos;s
                borrowed &quot;sakkā.&quot;
              </p>
            </>
          ) : (
            <>
              <p>
                Cron hits API-Football every 5 min. FT scores get baked in. We
                only roll the dice on games still on the schedule.
              </p>
              <p>
                Group stage: 12 groups of 4, round-robin, draws allowed. Knockout:
                32 teams, single elimination, no penalties modeled (yet).
              </p>
              <p>
                USA gets nerfed −50 for calling it soccer. Japan gets −15 for
                サッカー. Germany gets +15 for Fußball. Hosts get +10. Cry about
                it on Twitter after you lose your bet.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
