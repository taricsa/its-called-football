import type { SimulationMode, SimulationResult } from '@/lib/wc2026/types';
import styles from './wc2026.module.css';

type Wc2026MethodologyFooterProps = {
  result: SimulationResult;
  simulationMode: SimulationMode;
};

function formatSyncTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export default function Wc2026MethodologyFooter({
  result,
  simulationMode,
}: Wc2026MethodologyFooterProps) {
  const { snapshot, mode } = result;

  const liveSummary = snapshot?.warning
    ? snapshot.warning
    : snapshot && snapshot.source === 'fifa'
      ? `${snapshot.finishedCount} matches finished${
          snapshot.liveCount > 0 ? `, ${snapshot.liveCount} live` : ''
        }. Last synced ${formatSyncTime(snapshot.fetchedAt)} UTC.`
      : 'Live scores unavailable — standings from FIFA when reachable.';

  return (
    <div className={styles.footer}>
      <h3>How this works</h3>
      <p>
        Each run simulates the rest of the tournament thousands of times. For
        every simulation: remaining group-stage matches are played out using
        win/draw/loss probabilities derived from each team&apos;s Elo rating
        {simulationMode === 'serious'
          ? ', with a home-advantage bump for Mexico, Canada, and the USA during their group games.'
          : ', plus satirical linguistic adjustments when Linguistic Justice mode is on.'}{' '}
        Final group tables are settled by points, then goal difference, then goals
        for. The top two from each group plus the best eight third-place teams
        advance to a 32-team knockout bracket. Once the knockout draw is live,
        the simulation follows FIFA&apos;s published bracket (match numbers and
        placeholders), so every remaining fixture keeps its correct next-round
        pairing. Finished knockout ties — including those decided on penalties
        — are locked in from the FIFA feed.
      </p>
      <p>
        <strong>Serious mode (default)</strong> uses World Football Elo-style
        ratings and Elo-dependent draw rates. <strong>Linguistic Justice mode</strong>{' '}
        layers on satirical adjustments: +15 for correct football terminology, +10
        for hosts, −50 Hand-Egg Confusion Penalty for the United States, −15 for
        Japan&apos;s borrowed &quot;sakkā.&quot;
      </p>
      <p>
        <strong>Simplifications worth knowing about:</strong> in pre-tournament
        mode the Round-of-32 draw is a randomized pairing that avoids two teams
        from the same group meeting immediately — it does not fully replicate
        FIFA&apos;s published combination table for the eight third-place slots.
        Elo ratings are a single global snapshot, not adjusted for injuries,
        suspensions, or travel. For unfinished knockout matches we do not model
        extra time or penalty shootouts separately — the tie is resolved by Elo
        win probability alone. Once the tournament is live, real finished
        results (including penalty shootouts) come straight from FIFA and are
        locked in.
      </p>
      {mode === 'live' && (
        <p>
          <strong>About live mode:</strong> finished matches from FIFA&apos;s API are
          locked in; only remaining fixtures are simulated. The Δ column (serious
          mode only) shows change vs a pre-tournament baseline run with the same
          10,000 iterations and no results locked in.
        </p>
      )}
      <p className={styles.footerUpdated}>
        Data: FIFA public API ({liveSummary}) · Team ratings: World Football
        Elo-style, mid-2026 · Last simulation run shown in toolbar above.
      </p>
    </div>
  );
}
