'use client';

import React, { useState } from 'react';
import type { ThemeVariant } from '@/types/theme';

const SITE_URL = 'https://itscalledfootball.vercel.app';

const WARNING_SHARE_URL =
  'https://twitter.com/intent/tweet?text=' +
  encodeURIComponent(
    'You have been reported to the International Football Naming Authority. Comply immediately: ',
  ) +
  '&url=' +
  encodeURIComponent(SITE_URL);

const FAILED_SHARE_URL =
  'https://twitter.com/intent/tweet?text=' +
  encodeURIComponent(
    "I just failed the Metric Literacy Compliance Exam on It's Called Football. I don't know what a kilometer is. Help save me: ",
  ) +
  '&url=' +
  encodeURIComponent(SITE_URL);

type MetricQuizModalProps = {
  variant: ThemeVariant;
  children: React.ReactNode;
};

export default function MetricQuizModal({
  children,
}: MetricQuizModalProps) {
  const [hasPassed, setHasPassed] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    'warning' | 'q1' | 'q2' | 'q3' | 'failed'
  >('warning');
  const [cmInput, setCmInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const triggerFailure = (msg: string) => {
    setErrorMsg(msg);
    setCurrentStep('failed');
  };

  if (hasPassed) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 p-4 text-white antialiased selection:bg-red-500 selection:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-5" />

      <div className="relative w-full max-w-lg rounded-2xl border border-red-500/30 bg-zinc-900 p-8 text-center shadow-2xl shadow-red-950/20">
        {currentStep === 'warning' && (
          <div className="animate-fade-in space-y-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-500">
              <span className="text-2xl font-bold">⚠️</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-red-500">
              ACCESS DENIED, EAGLE BOY
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Our automated network architecture has detected a request
              originating from a region utilizing imperial measurements. Under
              International Football Law, your petition signature cannot be
              registered.
            </p>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-left">
              <p className="font-mono text-xs text-zinc-500">
                <span className="text-red-400">System Status:</span> Suspended
                until you configure what a kilometer actually is.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentStep('q1')}
                className="active:scale-[0.98] w-full rounded-xl bg-red-600 py-3.5 font-bold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500"
              >
                Take Metric Literacy Test to Request Access
              </button>
              <a
                href={WARNING_SHARE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 py-3.5 font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                📢 Send this to an American friend
              </a>
            </div>
          </div>
        )}

        {currentStep === 'q1' && (
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-red-400">
              Question 1 of 3
            </span>
            <h2 className="text-xl font-bold">
              Water freezes at 0° Celsius. What temperature does it freeze at
              in Fahrenheit?
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() =>
                  triggerFailure(
                    'Incorrect. Too logical to click. Why would a scale make simple numeric sense to you?',
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-left font-medium text-zinc-400 transition hover:bg-zinc-800/50"
              >
                [A] 32°F{' '}
                <span className="mt-0.5 block text-xs text-zinc-600">
                  (Too logical to click)
                </span>
              </button>
              <button
                onClick={() => setCurrentStep('q2')}
                className="w-full rounded-xl border border-red-500/20 bg-zinc-950/50 p-4 text-left font-medium text-zinc-200 transition hover:bg-zinc-800/50"
              >
                [B] A completely arbitrary triple-digit number invented by an
                18th-century scientist who had a fever.
              </button>
            </div>
          </div>
        )}

        {currentStep === 'q2' && (
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-red-400">
              Question 2 of 3
            </span>
            <h2 className="text-xl font-bold">
              How many centimeters are inside an exact, standard meter?
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={cmInput}
                onChange={(e) => setCmInput(e.target.value)}
                placeholder="Enter value..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center font-mono text-xl font-bold focus:border-red-500 focus:outline-none"
              />
              <button
                onClick={() => {
                  if (cmInput.trim() === '100') {
                    setCurrentStep('q3');
                  } else {
                    triggerFailure(
                      'Incorrect. Please review a basic ruler printed outside of North America.',
                    );
                  }
                }}
                className="w-full rounded-xl bg-white py-3.5 font-bold text-zinc-950 transition hover:bg-zinc-200"
              >
                Submit Metric Proof
              </button>
            </div>
          </div>
        )}

        {currentStep === 'q3' && (
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-red-400">
              Question 3 of 3
            </span>
            <h2 className="text-xl font-bold">
              Etymologically speaking, a &quot;foot&quot; is primarily
              designed to be...
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setHasPassed(true);
                }}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-left font-medium text-zinc-200 transition hover:bg-zinc-800/50"
              >
                [A] Used directly to kick a ball across a grass pitch while
                running.
              </button>
              <button
                onClick={() =>
                  triggerFailure(
                    'Incorrect. A foot is an anatomical appendage, not a structural variable of distance calculation.',
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-left font-medium text-zinc-400 transition hover:bg-zinc-800/50"
              >
                [B] An absolute unit of measurement because we refuse to
                convert our parameters alongside the other 190 countries.
              </button>
            </div>
          </div>
        )}

        {currentStep === 'failed' && (
          <div className="animate-shake space-y-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-red-400 bg-red-500 text-zinc-950">
              <span className="text-2xl font-bold">❌</span>
            </div>
            <h2 className="text-2xl font-black text-red-500">TEST FAILED</h2>
            <p className="text-sm leading-relaxed text-zinc-400">{errorMsg}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCmInput('');
                  setErrorMsg('');
                  setCurrentStep('warning');
                }}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 font-semibold text-zinc-400 transition hover:bg-zinc-800"
              >
                Retry Test
              </button>
              <a
                href="https://www.google.com/search?q=how+does+the+metric+system+work"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-800 py-3 font-semibold text-white transition hover:bg-zinc-700"
              >
                Educate Me
              </a>
            </div>
            <a
              href={FAILED_SHARE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl border border-red-500/40 bg-red-950 py-3.5 font-bold text-red-400 shadow-lg shadow-red-950/30 transition hover:border-red-400 hover:bg-red-900/40 hover:text-red-300"
            >
              🕊️ Share My Shame &amp; Admit Defeat
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
