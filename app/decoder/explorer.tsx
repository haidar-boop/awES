'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { DecoderSignal } from '@/lib/types';

interface DecoderRetailer {
  slug: string;
  name: string;
  brandColor: string;
  cadenceNotesMd: string;
  decoder: DecoderSignal[];
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  low: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
};

/** Tag-ending quiz (spec §4.7): match the ending to the retailer signal. */
const QUIZ: { question: string; options: string[]; answer: number; why: string }[] = [
  {
    question: 'A Home Depot yellow tag reads $3.02. What does the .02 ending tell you?',
    options: ['Regular price', 'Early clearance — ignore', 'Late-stage markdown: penny-watch it', 'Employee pricing'],
    answer: 2,
    why: '.02/.03/.04 endings are late-stage clearance signals; the community pattern says they tend to penny ~14 weeks after the tag’s clearance date.',
  },
  {
    question: 'A Costco sign shows $199.97 with an asterisk (*). What’s the situation?',
    options: [
      'Price error',
      'Manager markdown on a discontinued item — last chance',
      'Coming-soon item',
      'Members-only bonus',
    ],
    answer: 1,
    why: '.97 = manager markdown; the asterisk ("death star") = discontinued, won’t be restocked. Together they mark Costco’s deepest deals.',
  },
  {
    question: 'A Walmart shelf tag says $39.97 but the app scans $3.00. What is this?',
    options: ['A scam', 'Hidden clearance — the register charges $3.00', 'A tag someone swapped', 'App glitch'],
    answer: 1,
    why: 'Hidden clearance: the markdown is in the system, the shelf label just never got updated. The register always charges the system price.',
  },
  {
    question: 'It’s July and a Dollar Tree shelf still has Easter basket grass. Why scan it?',
    options: [
      'Seasonal items restock in July',
      'It may have been pennied on a markdown day and missed in the pull',
      'It’s probably $2 now',
      'No reason',
    ],
    answer: 1,
    why: 'Dollar Tree pennies discontinued/seasonal SKUs on markdown days as a pull signal — stragglers on the shelf often still scan $0.01.',
  },
];

function Quiz() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = QUIZ[idx];
  const done = idx >= QUIZ.length;

  if (done) {
    return (
      <div className="text-center">
        <p className="text-3xl" aria-hidden>{score === QUIZ.length ? '🏆' : '🪙'}</p>
        <p className="mt-2 font-semibold">You scored {score}/{QUIZ.length}</p>
        <button
          className="btn-secondary mt-4"
          onClick={() => {
            setIdx(0);
            setScore(0);
            setPicked(null);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-stone-400">Question {idx + 1} of {QUIZ.length}</p>
      <p className="mt-1 font-semibold">{q.question}</p>
      <div className="mt-3 grid gap-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            disabled={picked !== null}
            onClick={() => {
              setPicked(i);
              if (i === q.answer) setScore((s) => s + 1);
            }}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              picked === null
                ? 'border-stone-300 hover:border-penny-500 dark:border-stone-700'
                : i === q.answer
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                  : i === picked
                    ? 'border-red-400 bg-red-50 dark:bg-red-950'
                    : 'border-stone-200 opacity-60 dark:border-stone-800'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="mt-3">
          <p className="text-sm text-stone-600 dark:text-stone-400">{q.why}</p>
          <button
            className="btn-primary mt-3 !py-2"
            onClick={() => {
              setIdx((i) => i + 1);
              setPicked(null);
            }}
          >
            {idx + 1 === QUIZ.length ? 'See score' : 'Next question'}
          </button>
        </div>
      )}
    </div>
  );
}

export function DecoderExplorer({ retailers }: { retailers: DecoderRetailer[] }) {
  const [active, setActive] = useState(retailers[0]?.slug);
  const [openSignal, setOpenSignal] = useState<number | null>(0);
  const retailer = retailers.find((r) => r.slug === active) ?? retailers[0];

  if (!retailer) return null;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Retailer">
        {retailers.map((r) => (
          <button
            key={r.slug}
            role="tab"
            aria-selected={r.slug === active}
            onClick={() => {
              setActive(r.slug);
              setOpenSignal(0);
            }}
            className={`chip border px-3 py-1.5 text-sm ${
              r.slug === active
                ? 'border-transparent text-white'
                : 'border-stone-300 bg-white text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
            }`}
            style={r.slug === active ? { backgroundColor: r.brandColor } : undefined}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="card mt-4 p-5">
        <h2 className="font-bold">{retailer.name} — markdown cadence</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {retailer.cadenceNotesMd.replace(/\*\*/g, '')}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {retailer.decoder.map((signal, i) => (
          <div key={i} className="card overflow-hidden">
            <button
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
              onClick={() => setOpenSignal(openSignal === i ? null : i)}
              aria-expanded={openSignal === i}
            >
              <span className="font-semibold">{signal.signal}</span>
              <span className="flex items-center gap-2">
                <span className={`chip ${CONFIDENCE_STYLE[signal.confidence]}`}>{signal.confidence} confidence</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSignal === i ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {openSignal === i && (
              <p className="border-t border-stone-100 p-4 text-sm leading-relaxed text-stone-600 dark:border-stone-800 dark:text-stone-400">
                {signal.meaning}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="card mt-8 p-5">
        <h2 className="mb-4 font-bold">🎯 Tag-ending quiz</h2>
        <Quiz />
      </div>
    </div>
  );
}
