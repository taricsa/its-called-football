import type { ThemeVariant } from '@/types/theme';
import type { SimulationResult } from '@/lib/wc2026/types';

type SimulationDisclaimerProps = {
  result: SimulationResult;
  variant: ThemeVariant;
};

function formatSyncTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export default function SimulationDisclaimer({
  result,
  variant,
}: SimulationDisclaimerProps) {
  const isCourt = variant === 'court';
  const { snapshot, mode, iterations, hasBaselineComparison } = result;

  const liveSummary = snapshot?.warning
    ? `FIFA: ${snapshot.warning}`
    : snapshot && snapshot.source === 'fifa'
      ? `${snapshot.finishedCount} matches finished${
          snapshot.liveCount > 0 ? `, ${snapshot.liveCount} live` : ''
        }. Last synced ${formatSyncTime(snapshot.fetchedAt)} UTC.`
      : 'Live scores unavailable — showing pre-tournament projections.';

  return (
    <div
      className={
        isCourt
          ? 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-sans text-xs leading-relaxed text-amber-900'
          : 'rounded-2xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 font-mono text-xs leading-relaxed text-emerald-300'
      }
    >
      {isCourt ? (
        <>
          <strong className="uppercase tracking-wide">
            {mode === 'live' ? 'Live Probabilistic Decree' : 'Pre-Tournament Decree'}:
          </strong>{' '}
          Based on {iterations.toLocaleString()} simulated completions of the
          remaining tournament schedule, incorporating real results where
          available. {liveSummary}
          {hasBaselineComparison &&
            ' Δ column shows change vs pre-tournament baseline (same 10k sims, no results locked in).'}
        </>
      ) : (
        <>
          <strong className="uppercase tracking-wide">
            {mode === 'live' ? 'LIVE MODE' : 'PRE-TOURNAMENT MODE'}:
          </strong>{' '}
          {iterations.toLocaleString()} sims of what&apos;s left. Finished
          games are locked in; the rest is Elo chaos. {liveSummary}
          {hasBaselineComparison &&
            ' Δ = live minus pre-tournament baseline.'}
        </>
      )}
    </div>
  );
}
