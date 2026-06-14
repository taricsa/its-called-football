'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import GlobalCounter from '@/components/shared/GlobalCounter';
import TranslationMatrix from '@/components/shared/TranslationMatrix';

const HAND_EGG_DICT: Record<string, string> = {
  Touchdown: 'Unwarranted Commercial Advertisement Sequence',
  Quarterback: 'Primary Hand-Egg Distributor',
  'Halftime Show': 'The actual event people bought tickets for',
  Football: 'Armored corporate handball played with a brown egg',
};

function getTimeToYear3000() {
  const target = new Date('3000-01-01T00:00:00Z').getTime();
  const diff = Math.max(0, target - Date.now());
  const secs = Math.floor(diff / 1000);
  return {
    years: Math.floor(secs / (365.25 * 24 * 3600)),
    days: Math.floor((secs % (365.25 * 24 * 3600)) / (24 * 3600)),
    hours: Math.floor((secs % (24 * 3600)) / 3600),
    mins: Math.floor((secs % 3600) / 60),
    secs: secs % 60,
  };
}

export default function MemeTheme() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [redCard, setRedCard] = useState(false);

  const [travelerName, setTravelerName] = useState('');
  const [generatedApology, setGeneratedApology] = useState('');
  const [copied, setCopied] = useState(false);

  const [timeLeft, setTimeRemaining] = useState(getTimeToYear3000);

  const [eggInput, setEggInput] = useState('');
  const [eggOutput, setEggOutput] = useState('');

  const whistleRef = useRef<HTMLAudioElement | null>(null);
  const hadSoccerRef = useRef(false);

  const playWhistle = useCallback(() => {
    if (!whistleRef.current) {
      whistleRef.current = new Audio('/whistle.mp3');
    }
    const whistle = whistleRef.current;
    whistle.volume = 0.4;
    whistle.currentTime = 0;
    whistle.play().catch(() => {});
  }, []);

  const scanInput = useCallback(
    (value: string) => {
      const hasSoccer = value.toLowerCase().includes('soccer');

      if (hasSoccer) {
        setRedCard(true);
        const rawCorrection = value.replace(/soccer/gi, 'FOOTBALL');
        setOutput(
          `🤡 ERROR: DID YOU MEAN: "${rawCorrection.toUpperCase()} LIKE A CIVILIZED HUMAN BEING"? 🤡`,
        );
        if (!hadSoccerRef.current) {
          playWhistle();
        }
      } else if (value.trim() === '') {
        setRedCard(false);
        setOutput('');
      } else {
        setRedCard(false);
        setOutput('✅ STATUS: NO LINGUISTIC CRIMES DETECTED. CHILL.');
      }

      hadSoccerRef.current = hasSoccer;
    },
    [playWhistle],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeToYear3000());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    scanInput(value);
  };

  const handleTranslate = (e: React.FormEvent) => {
    e.preventDefault();
    scanInput(input);
  };

  const handleGenerateApology = (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelerName.trim()) return;
    setCopied(false);
    setGeneratedApology(
      `DEAR CITIZENS OF THE CIVILIZED WORLD,\n\nI, ${travelerName.toUpperCase()}, hereby issue an official apology for my country's linguistic crimes. I promise to control the ball using my actual feet, look at the actual pitch, and never refer to an armored commercial break advertisement sequence as "football" while traveling on your soil.\n\nSigned,\nA Repentant American`,
    );
  };

  const handleEggTermClick = (term: string) => {
    setEggInput(term);
    setEggOutput(HAND_EGG_DICT[term]);
  };

  const handleEggTranslate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = eggInput.trim();
    const key = Object.keys(HAND_EGG_DICT).find(
      (k) => k.toLowerCase() === trimmed.toLowerCase(),
    );
    setEggOutput(
      key
        ? HAND_EGG_DICT[key]
        : trimmed
          ? 'No translation on record. Term may be too absurd even for this system.'
          : '',
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100 antialiased selection:bg-emerald-500 selection:text-zinc-950">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-3 text-center">
          <div className="inline-flex animate-bounce text-4xl">⚽💥📢</div>
          <h1 className="bg-gradient-to-r from-emerald-400 via-green-200 to-emerald-500 bg-clip-text text-4xl font-black uppercase tracking-tighter text-transparent md:text-5xl">
            IT IS CALLED FOOTBALL.
          </h1>
          <p className="mx-auto max-w-xl font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
            Imagine using your hands for 99% of a match and calling it
            &quot;football&quot;. Couldn&apos;t be the rest of the planet.
          </p>
        </header>

        <GlobalCounter variant="meme" />

        <div className="grid gap-8 md:grid-cols-2">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-zinc-800 bg-zinc-900 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h4 className="text-base font-black uppercase tracking-tight text-white">
                  Linguistic Slang Filter
                </h4>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                  V1.0
                </span>
              </div>

              <form onSubmit={handleTranslate} className="space-y-3">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type a sentence... (Include 'soccer' to trigger security systems)"
                  className="min-h-[100px] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300 transition focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="active:scale-[0.98] w-full rounded-xl bg-emerald-500 py-3 font-mono text-xs font-black uppercase text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                >
                  Scan Phrasing Syntax
                </button>
              </form>
            </div>

            {output && (
              <div
                className={`mt-4 rounded-xl border p-4 font-mono text-xs font-bold leading-normal transition-all ${
                  redCard
                    ? 'animate-shake border-red-500/30 bg-red-950/20 text-red-400'
                    : 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400'
                }`}
              >
                {redCard && (
                  <span className="mb-1 block animate-pulse tracking-wider text-red-500">
                    🟥 RED CARD TRIGGERED: EXPELLABLE PHRASING
                  </span>
                )}
                {output}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-2xl border-2 border-zinc-800 bg-zinc-900 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h4 className="text-base font-black uppercase tracking-tight text-white">
                  Apology Statement Generator
                </h4>
                <span className="font-mono text-xs text-zinc-500">
                  For US travelers abroad
                </span>
              </div>

              {!generatedApology ? (
                <form onSubmit={handleGenerateApology} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Target Traveler Name
                    </label>
                    <input
                      type="text"
                      required
                      value={travelerName}
                      onChange={(e) => setTravelerName(e.target.value)}
                      placeholder="Enter legal name..."
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-2 w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 py-3 font-mono text-xs font-black uppercase text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                  >
                    Assemble Cleansing Statement
                  </button>
                </form>
              ) : (
                <div className="animate-fade-in space-y-3 font-mono text-xs">
                  <pre className="max-h-[140px] w-full overflow-x-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono leading-relaxed text-zinc-400">
                    {generatedApology}
                  </pre>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedApology);
                        setCopied(true);
                      }}
                      className={`w-full rounded-xl py-2.5 text-xs font-bold uppercase transition ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-zinc-950 hover:bg-zinc-200'
                      }`}
                    >
                      {copied ? '📋 Copied Statement!' : 'Copy to Clipboard'}
                    </button>
                    <button
                      onClick={() => setGeneratedApology('')}
                      className="rounded-xl border border-zinc-800 px-3 text-zinc-500 transition hover:border-zinc-600 hover:text-white"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-4 border-t border-zinc-800 pt-3 font-mono text-[9px] leading-normal text-zinc-600">
              *Warning: Failure to carry this text verification structure while
              entering Europe or South America voids absolute physical alignment
              rules.
            </p>
          </div>
          <div className="md:col-span-2 rounded-2xl border-2 border-amber-500/40 bg-zinc-900 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h4 className="text-base font-black uppercase tracking-tight text-white">
                  Hand-Egg Translation Terminal
                </h4>
                <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                  EN-AMERICAN → FOOTBALL
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.keys(HAND_EGG_DICT).map((term) => (
                  <button
                    key={term}
                    onClick={() => handleEggTermClick(term)}
                    className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-bold transition ${
                      eggInput === term
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-200'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>

              <form onSubmit={handleEggTranslate} className="flex gap-2">
                <input
                  type="text"
                  value={eggInput}
                  onChange={(e) => {
                    setEggInput(e.target.value);
                    setEggOutput('');
                  }}
                  placeholder="Or type a gridiron term..."
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-4 font-mono text-xs font-black uppercase text-zinc-950 transition hover:bg-amber-400"
                >
                  Translate
                </button>
              </form>

              {eggOutput && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 font-mono text-xs font-bold leading-relaxed text-amber-300">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-amber-500">
                    Official Football Translation:
                  </span>
                  {eggOutput}
                </div>
              )}
            </div>
          </div>
        </div>

        <TranslationMatrix variant="meme" />

        <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center font-mono">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Estimated Countdown Until North America Abandons Imperial
            Measurement Paradigms
          </h4>
          <div className="flex justify-center gap-4 text-lg font-bold tracking-tight text-white md:text-xl">
            <div>
              <span className="text-emerald-500">{timeLeft.years}</span>Y
            </div>
            <div>
              <span className="text-emerald-500">{timeLeft.days}</span>D
            </div>
            <div>
              <span className="text-emerald-500">{timeLeft.hours}</span>H
            </div>
            <div>
              <span className="text-emerald-500">{timeLeft.mins}</span>M
            </div>
            <div>
              <span className="animate-pulse text-emerald-500">
                {timeLeft.secs}
              </span>
              S
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-600">
            Live countdown to the Year 3000 metric-system adoption threshold
          </p>
        </div>

        <footer className="pt-4 text-center">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('#ItsCalledFootball help protect an isolated American from etymological confusion today: ')}&url=${encodeURIComponent('https://itscalledfootball.vercel.app')}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-3 font-mono text-xs font-black uppercase text-zinc-300 shadow-xl transition hover:border-zinc-700 hover:text-white"
          >
            🔥 Launch Internet Grenade to Twitter Channels
          </a>
        </footer>
      </div>
    </div>
  );
}
