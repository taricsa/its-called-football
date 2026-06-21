'use client';

import React, { useState, useEffect } from 'react';
import type { ThemeVariant } from '@/types/theme';

const BASELINE = 4_512_384_921;
const EPOCH_MS = new Date('2026-01-01T00:00:00Z').getTime();
const RATE_PER_SECOND = 2.5;

function computeSeedCount(now = Date.now()) {
  const elapsedSeconds = Math.max(0, (now - EPOCH_MS) / 1000);
  return BASELINE + Math.floor(elapsedSeconds * RATE_PER_SECOND);
}

type GlobalCounterProps = {
  variant: ThemeVariant;
};

export default function GlobalCounter({ variant }: GlobalCounterProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) =>
        prev === null
          ? computeSeedCount()
          : prev + Math.floor(Math.random() * 5) + 2,
      );
    }, 450);

    return () => clearInterval(interval);
  }, []);

  const formattedCount = new Intl.NumberFormat('en-US').format(
    count ?? BASELINE,
  );

  if (variant === 'court') {
    return (
      <div className="rounded-xl border border-zinc-200 bg-stone-50 p-8 text-center font-serif shadow-sm">
        <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Global Registry of Linguistic Compliance
        </h3>
        <div className="font-mono text-4xl font-bold tabular-nums tracking-tight text-zinc-900 md:text-5xl">
          {formattedCount}
        </div>
        <p className="mt-3 font-sans text-sm italic text-zinc-600">
          Active individuals currently utilizing the correct terminology across
          civilized borders.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-emerald-500 bg-zinc-950 p-6 text-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
      <h3 className="mb-1 animate-pulse text-xs font-black uppercase tracking-wider text-emerald-400">
        🧠 BRAIN CELLS RESTORED WORLDWIDE
      </h3>
      <div className="font-mono text-4xl font-black tabular-nums tracking-tight text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] md:text-6xl">
        {formattedCount}
      </div>
      <p className="mt-2 text-xs font-extrabold uppercase tracking-tight text-zinc-400">
        People currently playing <span className="text-white">FOOTBALL</span>{' '}
        while America looks for commercial breaks.
      </p>
    </div>
  );
}
