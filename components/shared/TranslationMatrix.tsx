'use client';

import React, { useState } from 'react';
import type { ThemeVariant } from '@/types/theme';

type TranslationMatrixProps = {
  variant: ThemeVariant;
};

const languages = [
  {
    lang: 'German',
    word: 'Fußball',
    literal: 'Fuß (Foot) + Ball (Ball)',
    note: 'Flawless German engineering.',
  },
  {
    lang: 'Chinese',
    word: '足球 (Zúqiú)',
    literal: '足 (Foot) + 球 (Ball)',
    note: 'Ancient civilization logic.',
  },
  {
    lang: 'Dutch',
    word: 'Voetbal',
    literal: 'Voet (Foot) + Bal (Ball)',
    note: 'Total football compatibility.',
  },
  {
    lang: 'Polish',
    word: 'Piłka nożna',
    literal: 'Piłka (Ball) + Nożna (Footed)',
    note: 'Anatomically precise.',
  },
  {
    lang: 'Spanish',
    word: 'Fútbol / Balompié',
    literal: 'Balón (Ball) + Pie (Foot)',
    note: 'Beautiful game, beautiful math.',
  },
  {
    lang: 'Portuguese-PT',
    word: 'Futebol',
    literal: 'Pé (Foot) + Bola (Ball)',
    note: 'Iberian peninsula compliance. Exemplary.',
  },
  {
    lang: 'Portuguese-BR',
    word: 'Futebol',
    literal: 'Pé (Foot) + Bola (Ball)',
    note: 'Five World Cups of correct terminology.',
  },
  {
    lang: 'Italian',
    word: 'Calcio',
    literal: 'From calciare (To kick)',
    note: 'A complete action verb. Valid.',
  },
  {
    lang: 'Japanese',
    word: 'サッカー (Sakkā)',
    literal: "Borrowed 'Soccer'",
    note: '⚠️ Click to inspect anomaly.',
    isTraitor: true,
  },
];

export default function TranslationMatrix({ variant }: TranslationMatrixProps) {
  const [showTraitorWarning, setShowTraitorWarning] = useState(false);

  return (
    <div className="relative w-full">
      {showTraitorWarning && (
        <div className="animate-fade-in absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl border border-red-500/40 bg-red-950/95 p-6 text-center text-white backdrop-blur-sm">
          <p className="text-3xl">🚨</p>
          <h4 className="mt-2 text-xl font-black uppercase text-red-400">
            ET TU, JAPAN?
          </h4>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-300">
            We expected absolute surgical precision from the land of bullet
            trains, but they imported the slang word anyway. We are deeply
            disappointed.
          </p>
          <button
            onClick={() => setShowTraitorWarning(false)}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold transition hover:bg-red-500"
          >
            Dismiss Investigation Dossier
          </button>
        </div>
      )}

      {variant === 'court' ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white font-sans text-sm">
          <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4">
            <h4 className="font-serif text-base font-bold text-zinc-900">
              Exhibit A: Global Etymological Consensus
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-3">Jurisdiction</th>
                  <th className="px-6 py-3">Legal Nomenclature</th>
                  <th className="px-6 py-3">Literal Translation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {languages.map((item) => (
                  <tr
                    key={item.lang}
                    className={`transition hover:bg-zinc-50/50 ${item.isTraitor ? 'cursor-pointer font-medium text-red-700' : ''}`}
                    onClick={
                      item.isTraitor
                        ? () => setShowTraitorWarning(true)
                        : undefined
                    }
                  >
                    <td className="px-6 py-3.5 font-semibold">{item.lang}</td>
                    <td className="bg-zinc-50/30 px-6 py-3.5 font-mono text-zinc-900">
                      {item.word}
                    </td>
                    <td className="px-6 py-3.5 text-zinc-500">{item.literal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-zinc-800 bg-zinc-900 p-6">
          <h4 className="mb-4 flex items-center gap-2 text-xl font-black uppercase tracking-tight text-white">
            🌍 LITERALLY THE ENTIRE PLANET:
          </h4>
          <div className="grid gap-3">
            {languages.map((item) => (
              <div
                key={item.lang}
                onClick={
                  item.isTraitor ? () => setShowTraitorWarning(true) : undefined
                }
                className={`flex flex-col justify-between rounded-xl border p-3.5 transition sm:flex-row sm:items-center ${
                  item.isTraitor
                    ? 'animate-pulse cursor-pointer border-red-900/40 bg-red-950/20 hover:bg-red-950/40'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="min-w-28 shrink-0 text-sm font-black text-zinc-400">
                    {item.lang}
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-400">
                    {item.word}
                  </span>
                </div>
                <span
                  className={`mt-1 text-xs sm:mt-0 ${item.isTraitor ? 'font-bold text-red-400' : 'font-medium text-zinc-500'}`}
                >
                  👉 {item.isTraitor ? item.note : item.literal}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
