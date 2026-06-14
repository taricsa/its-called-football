'use client';

import React, { useState } from 'react';
import GlobalCounter from '@/components/shared/GlobalCounter';
import TranslationMatrix from '@/components/shared/TranslationMatrix';

const CLEAN_STATUS_MESSAGE =
  'Status: Text clean. No etymological violations found.';

export default function CourtTheme() {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [hasViolation, setHasViolation] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    country: 'United Kingdom',
  });
  const [submissionStatus, setSubmissionStatus] = useState<
    'idle' | 'certified' | 'probation'
  >('idle');

  const handleRectification = (e: React.FormEvent) => {
    e.preventDefault();
    const lowerText = inputText.toLowerCase();

    if (lowerText.includes('soccer')) {
      setHasViolation(true);
      setStatusMessage('');
      setCorrectedText(
        inputText.replace(/soccer/gi, (match) =>
          match === 'Soccer' ? 'Football (Association Football)' : 'football',
        ),
      );
    } else if (inputText.trim() === '') {
      setHasViolation(false);
      setCorrectedText('');
      setStatusMessage('');
    } else {
      setHasViolation(false);
      setCorrectedText('');
      setStatusMessage(CLEAN_STATUS_MESSAGE);
    }
  };

  const handlePetitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      setSubmissionStatus(
        formData.country === 'United Kingdom' ? 'probation' : 'certified',
      );
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-12 font-serif text-zinc-900 antialiased selection:bg-zinc-200">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-2 border-b border-zinc-300 pb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-zinc-800 font-sans text-xl font-bold">
            ⚖️
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 md:text-4xl">
            The International Court of Football Justice
          </h1>
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Chamber for Etymological Rectitude & Linguistic Harmonization
          </p>
        </header>

        <GlobalCounter variant="court" />

        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <h4 className="text-base font-bold text-zinc-800">
                  Document Rectification Tool
                </h4>
                <p className="font-sans text-xs text-zinc-400">
                  Scan phrasing for underlying linguistic anomalies.
                </p>
              </div>

              <form onSubmit={handleRectification} className="space-y-3">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste statement here (e.g., I plan to watch soccer this weekend...)"
                  className="min-h-[100px] w-full resize-none rounded-lg border border-zinc-200 bg-stone-50/50 p-3 font-sans text-sm transition focus:border-zinc-500 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-zinc-900 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-800"
                >
                  Analyze Text Phrasing
                </button>
              </form>
            </div>

            {(hasViolation || statusMessage) && (
              <div
                className={`mt-4 rounded-lg border p-4 font-sans text-xs leading-relaxed ${
                  hasViolation
                    ? 'border-red-200 bg-red-50 text-red-900'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                }`}
              >
                {hasViolation && (
                  <span className="mb-1 block font-bold uppercase tracking-wide text-red-700">
                    ⚠️ VIOLATION DETECTED: CODE 404 (PROHIBITED SLANG)
                  </span>
                )}
                {hasViolation ? (
                  <>
                    Did you mean: &quot;{correctedText}&quot;?
                  </>
                ) : (
                  statusMessage
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <h4 className="text-base font-bold text-zinc-800">
                  Resolution 45-90 Signature Entry
                </h4>
                <p className="font-sans text-xs text-zinc-400">
                  Affix your name to the official global accord to eliminate
                  the S-Word.
                </p>
              </div>

              {submissionStatus === 'idle' ? (
                <form
                  onSubmit={handlePetitionSubmit}
                  className="space-y-3 font-sans text-xs"
                >
                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-zinc-500">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Sir Bobby Charlton"
                      className="w-full rounded-lg border border-zinc-200 p-3 font-serif text-sm focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-zinc-500">
                      Sovereign Jurisdiction
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm focus:border-zinc-500 focus:outline-none"
                    >
                      <option>United Kingdom</option>
                      <option>France</option>
                      <option>Brazil</option>
                      <option>Argentina</option>
                      <option>Germany</option>
                      <option>Other Civilized Nation</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="mt-2 w-full rounded-lg border border-zinc-300 border-b-2 border-b-zinc-400 bg-zinc-50 py-3 font-bold uppercase tracking-wider text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Affix Notarized Signature
                  </button>
                </form>
              ) : submissionStatus === 'certified' ? (
                <div className="animate-fade-in relative space-y-3 overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-stone-50/50 p-6 text-center">
                  <div className="absolute right-2 top-2 rotate-12 select-none rounded border border-emerald-600 px-2 py-0.5 font-sans text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    CERTIFIED
                  </div>
                  <p className="text-2xl">📜</p>
                  <h5 className="font-bold text-zinc-800">
                    Accord Signature Registered
                  </h5>
                  <p className="font-sans text-xs leading-relaxed text-zinc-500">
                    Thank you,{' '}
                    <span className="font-serif font-bold text-zinc-900">
                      {formData.name}
                    </span>
                    . Your pledge of etymological alignment has been formally
                    written into the global archives.
                  </p>
                </div>
              ) : (
                <div className="animate-fade-in relative space-y-3 overflow-hidden rounded-lg border-2 border-amber-300 bg-amber-50 p-6">
                  <div className="absolute right-2 top-2 rotate-12 select-none rounded border border-amber-600 px-2 py-0.5 font-sans text-[10px] font-black uppercase tracking-widest text-amber-700">
                    FLAGGED
                  </div>
                  <p className="text-xl">⚠️</p>
                  <h5 className="font-bold uppercase tracking-wide text-amber-900">
                    Application Flag: Ancestral Accountability Clause Triggered
                  </h5>
                  <p className="font-sans text-xs leading-relaxed text-amber-800">
                    Your country invented the word &quot;soccer&quot; as
                    19th-century university slang before abandoning it. Your
                    signature has been accepted,{' '}
                    <span className="font-serif font-bold text-amber-900">
                      {formData.name}
                    </span>
                    , but your jurisdiction is hereby placed on{' '}
                    <span className="font-black uppercase">
                      Etymological Probation
                    </span>
                    .
                  </p>
                  <div className="mt-2 rounded border border-amber-200 bg-amber-100/60 p-3 font-sans text-[10px] leading-normal text-amber-700">
                    STATUS: Provisional signatory. Full ratification pending
                    linguistic remediation. The Court acknowledges your
                    cooperation and notes it is, frankly, the least you could
                    do.
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 border-t border-zinc-100 pt-3 font-sans text-[10px] leading-normal text-zinc-400">
              *Notice: By submitting formatting details, you verify under global
              oversight that feet belong on the pitch, balls are spherical
              shapes, and timeouts belong in kindergarten.
            </p>
          </div>
        </div>

        <TranslationMatrix variant="court" />

        <footer className="border-t border-zinc-300 pt-6 text-center">
          <a
            href={
              'https://twitter.com/intent/tweet?text=' +
              encodeURIComponent(
                'I have just signed the International Declaration of Football Accuracy. It is time to end the linguistic dark ages. Educate yourselves: ',
              ) +
              '&url=' +
              encodeURIComponent('https://itscalledfootball.vercel.app')
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-zinc-600 shadow-sm transition hover:text-zinc-900"
          >
            📢 Dispatch Passive-Aggressive Reminder to Social Channels
          </a>
        </footer>
      </div>
    </div>
  );
}
