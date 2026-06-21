import Link from 'next/link';
import type { SimulationResult } from '@/lib/wc2026/types';
import type { ThemeVariant } from '@/types/theme';
import MethodologyPanel from './MethodologyPanel';
import ProbabilityTable from './ProbabilityTable';
import SimulationDisclaimer from './SimulationDisclaimer';

type Wc2026PageProps = {
  result: SimulationResult;
  variant: ThemeVariant;
};

export default function Wc2026Page({ result, variant }: Wc2026PageProps) {
  const isCourt = variant === 'court';
  const activeTeams = result.teams.filter((team) => !team.eliminated);
  const topThree = activeTeams.slice(0, 3);

  return (
    <div
      className={
        isCourt
          ? 'min-h-screen bg-stone-100 px-4 py-12 font-serif text-zinc-900'
          : 'min-h-screen bg-zinc-950 px-4 py-12 font-mono text-zinc-100'
      }
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-4 text-center">
          <Link
            href="/"
            className={
              isCourt
                ? 'inline-block font-sans text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition hover:text-zinc-700'
                : 'inline-block font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-600 transition hover:text-emerald-400'
            }
          >
            ← Return to Linguistic Justice HQ
          </Link>

          <p
            className={
              isCourt
                ? 'font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400'
                : 'font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500'
            }
          >
            FIFA World Cup 2026™
          </p>

          <h1
            className={
              isCourt
                ? 'text-3xl font-bold tracking-tight md:text-4xl'
                : 'text-3xl font-black uppercase tracking-tight text-white md:text-4xl'
            }
          >
            {isCourt
              ? 'Championship Probability Docket'
              : 'WHO WINS THE FOOTBALL WORLD CUP'}
          </h1>

          <p
            className={
              isCourt
                ? 'mx-auto max-w-2xl font-sans text-sm leading-relaxed text-zinc-600'
                : 'mx-auto max-w-2xl font-mono text-sm leading-relaxed text-zinc-400'
            }
          >
            {isCourt
              ? result.mode === 'live'
                ? 'The Court recalculates after every final whistle — real results locked in, remaining fixtures simulated ten thousand times.'
                : 'The Court has run ten thousand simulated tournaments to determine which nation most deserves to lift the trophy — adjusted for etymological compliance.'
              : result.mode === 'live'
                ? 'Match ends → cron polls API-Football → we re-sim what\'s left. Real scores in, fake futures out.'
                : '10,000 sims. 48 teams. One trophy. Probabilities computed by Elo, not by ChatGPT having a guess.'}
          </p>
        </header>

        <SimulationDisclaimer result={result} variant={variant} />

        <div
          className={
            isCourt
              ? 'grid gap-4 md:grid-cols-3'
              : 'grid gap-4 md:grid-cols-3'
          }
        >
          {topThree.map((team, index) => (
            <div
              key={team.teamId}
              className={
                isCourt
                  ? 'rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm'
                  : 'rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-center'
              }
            >
              <p
                className={
                  isCourt
                    ? 'font-sans text-[10px] font-bold uppercase tracking-widest text-zinc-400'
                    : 'font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500'
                }
              >
                #{index + 1} {index === 0 ? 'Favourite' : 'Contender'}
              </p>
              <p
                className={
                  isCourt
                    ? 'mt-2 text-xl font-bold'
                    : 'mt-2 text-xl font-black uppercase text-white'
                }
              >
                {team.name}
              </p>
              <p
                className={
                  isCourt
                    ? 'mt-1 font-sans text-2xl font-bold text-emerald-700'
                    : 'mt-1 font-mono text-2xl font-black text-emerald-400'
                }
              >
                {(team.probability * 100).toFixed(1)}%
              </p>
              <p
                className={
                  isCourt
                    ? 'mt-2 font-sans text-[11px] text-zinc-500'
                    : 'mt-2 font-mono text-[10px] text-zinc-500'
                }
              >
                Group {team.group} · Elo {Math.round(team.adjustedElo)}
              </p>
            </div>
          ))}
        </div>

        <MethodologyPanel variant={variant} />

        <ProbabilityTable teams={result.teams} variant={variant} />

        <footer
          className={
            isCourt
              ? 'border-t border-zinc-300 pt-6 text-center font-sans text-[10px] text-zinc-400'
              : 'border-t border-zinc-800 pt-6 text-center font-mono text-[10px] text-zinc-600'
          }
        >
          Probabilities sum to {(result.totalProbability * 100).toFixed(1)}% across{' '}
          {result.teams.length} nations. One team wins each simulation. Math
          checks out.
        </footer>
      </div>
    </div>
  );
}
