'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { runMonteCarloChunked } from '@/lib/wc2026/client-runner';
import { getTopTeamsByProbability } from '@/lib/wc2026/rankings';
import { DEFAULT_ITERATIONS } from '@/lib/wc2026/simulate';
import type {
  GroupLetter,
  SimulationMode,
  SimulationResult,
  TournamentSnapshot,
} from '@/lib/wc2026/types';
import Wc2026MethodologyFooter from './Wc2026MethodologyFooter';
import Wc2026ProbabilityTable from './Wc2026ProbabilityTable';
import styles from './wc2026.module.css';

const GROUPS: GroupLetter[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
];

const ITERATION_OPTIONS = [2000, 10000, 25000, 50000];

type Wc2026DashboardProps = {
  initialResult: SimulationResult;
  snapshot: TournamentSnapshot | null;
  fontClassName: string;
};

function formatSyncTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

function formatSyncNote(snapshot: TournamentSnapshot | null): string {
  if (!snapshot || snapshot.source !== 'fifa') {
    return 'FIFA data unavailable — simulating full schedule from Elo.';
  }
  if (snapshot.warning) {
    return snapshot.warning;
  }
  return `${snapshot.finishedCount} finished${
    snapshot.liveCount > 0 ? `, ${snapshot.liveCount} live` : ''
  } · synced ${formatSyncTime(snapshot.fetchedAt)} UTC`;
}

function formatInitialRunInfo(
  iterations: number,
  snapshot: TournamentSnapshot | null,
): string {
  return `${iterations.toLocaleString()} runs · server initial load · ${formatSyncNote(snapshot)}`;
}

export default function Wc2026Dashboard({
  initialResult,
  snapshot,
  fontClassName,
}: Wc2026DashboardProps) {
  const [result, setResult] = useState(initialResult);
  const [simulationMode, setSimulationMode] =
    useState<SimulationMode>('serious');
  const [iterations, setIterations] = useState(DEFAULT_ITERATIONS);
  const [activeGroup, setActiveGroup] = useState<GroupLetter | 'ALL'>('ALL');
  const [isRunning, setIsRunning] = useState(false);
  const [runInfo, setRunInfo] = useState(() =>
    formatInitialRunInfo(initialResult.iterations, snapshot),
  );

  const topThree = useMemo(
    () => getTopTeamsByProbability(result.teams, 3),
    [result.teams],
  );

  const liveEyebrow = useMemo(() => {
    if (result.mode !== 'live' || !snapshot) {
      return 'PRE-TOURNAMENT · MONTE CARLO MODEL';
    }

    const isFinalMatch = (round: string) =>
      round.includes('final') &&
      !round.includes('semi') &&
      !round.includes('quarter') &&
      !round.includes('third') &&
      !round.includes('3rd') &&
      !round.includes('play-off');

    const anyUnfinished = (predicate: (round: string) => boolean) =>
      snapshot.matches.some(
        (match) =>
          match.status !== 'finished' &&
          predicate(match.round.toLowerCase()),
      );

    const isRoundFullyFinished = (predicate: (round: string) => boolean) => {
      const roundMatches = snapshot.matches.filter((match) =>
        predicate(match.round.toLowerCase()),
      );
      return (
        roundMatches.length > 0 &&
        roundMatches.every((match) => match.status === 'finished')
      );
    };

    if (anyUnfinished((r) => r.includes('group'))) {
      return 'GROUP STAGE · LIVE MODEL · FIFA SYNC';
    }
    if (anyUnfinished((r) => r.includes('round of 32') || r.includes('1/16'))) {
      return 'ROUND OF 32 · LIVE MODEL · FIFA SYNC';
    }
    if (anyUnfinished((r) => r.includes('round of 16') || r.includes('1/8'))) {
      return 'ROUND OF 16 · LIVE MODEL · FIFA SYNC';
    }
    if (anyUnfinished((r) => r.includes('quarter'))) {
      return 'QUARTER-FINALS · LIVE MODEL · FIFA SYNC';
    }
    if (anyUnfinished((r) => r.includes('semi'))) {
      return 'SEMI-FINALS · LIVE MODEL · FIFA SYNC';
    }
    if (anyUnfinished(isFinalMatch)) {
      return 'FINAL WEEK · LIVE MODEL · FIFA SYNC';
    }
    if (isRoundFullyFinished(isFinalMatch)) {
      return 'CHAMPION CROWNED · FIFA SYNC';
    }
    return 'LIVE MODEL · FIFA SYNC';
  }, [result.mode, snapshot]);

  const syncNote = useMemo(() => formatSyncNote(snapshot), [snapshot]);

  const doRun = useCallback(
    async (mode: SimulationMode, n: number) => {
      setIsRunning(true);
      setRunInfo(`running ${n.toLocaleString()} simulations…`);

      const { result: nextResult, elapsedMs } = await runMonteCarloChunked(
        n,
        mode,
        snapshot,
      );

      const merged: SimulationResult = {
        ...nextResult,
        hasBaselineComparison: initialResult.hasBaselineComparison,
        teams: nextResult.teams.map((team) => {
          const baseline = initialResult.teams.find(
            (t) => t.teamId === team.teamId,
          );
          const baselineProbability = baseline?.baselineProbability;

          if (
            !initialResult.hasBaselineComparison ||
            mode !== 'serious' ||
            baselineProbability === undefined
          ) {
            return {
              ...team,
              baselineProbability,
              probabilityDelta: undefined,
            };
          }

          return {
            ...team,
            baselineProbability,
            probabilityDelta: team.probability - baselineProbability,
          };
        }),
      };

      setResult(merged);
      setRunInfo(
        `${n.toLocaleString()} runs · ${Math.round(elapsedMs)}ms · updated just now`,
      );
      setIsRunning(false);
    },
    [initialResult, snapshot],
  );

  const handleModeChange = (mode: SimulationMode) => {
    if (mode === simulationMode || isRunning) {
      return;
    }
    setSimulationMode(mode);
    void doRun(mode, iterations);
  };

  const handleRun = () => {
    void doRun(simulationMode, iterations);
  };

  return (
    <div className={`${styles.pitch} ${fontClassName}`}>
      <div className={styles.wrap}>
        <div className={styles.hero}>
          <div className={styles.heroHeader}>
            <Link href="/" className={styles.backLink}>
              ← Return to Linguistic Justice HQ
            </Link>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              {liveEyebrow}
            </div>
            <h1 className={styles.title}>WORLD CUP 2026 — TITLE ODDS</h1>
          </div>

          <div className={styles.heroPodium}>
            {topThree.map((team, index) => (
              <div
                key={team.teamId}
                className={`${styles.podiumCard} ${
                  index === 0 ? styles.podiumLead : ''
                }`}
              >
                <p className={styles.podiumRank}>
                  #{index + 1}{' '}
                  {index === 0 ? 'Favourite' : 'Contender'}
                </p>
                <p className={styles.podiumName}>{team.name}</p>
                <p className={styles.podiumPct}>
                  {(team.probability * 100).toFixed(1)}%
                </p>
                <p className={styles.podiumMeta}>
                  Group {team.group} · Elo {Math.round(team.adjustedElo)}
                </p>
              </div>
            ))}
          </div>

          <p className={styles.heroSub}>
            Monte Carlo estimate of each of the 48 teams&apos; chance of winning
            the tournament — built from{' '}
            {result.mode === 'live'
              ? 'live FIFA results plus simulated remaining fixtures'
              : 'Elo-based match probabilities across the full schedule'}
            . {syncNote}
          </p>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.controls}>
            <select
              className={styles.select}
              value={iterations}
              onChange={(event) =>
                setIterations(Number.parseInt(event.target.value, 10))
              }
              disabled={isRunning}
            >
              {ITERATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.toLocaleString()} runs
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.runBtn}
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? 'Simulating…' : 'Run simulation'}
            </button>
            <div className={styles.modeToggle}>
              <button
                type="button"
                className={`${styles.modeBtn} ${
                  simulationMode === 'serious' ? styles.modeBtnActive : ''
                }`}
                onClick={() => handleModeChange('serious')}
                disabled={isRunning}
              >
                Serious
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${
                  simulationMode === 'satirical' ? styles.modeBtnActive : ''
                }`}
                onClick={() => handleModeChange('satirical')}
                disabled={isRunning}
              >
                Linguistic Justice
              </button>
            </div>
          </div>
          <div className={styles.runInfo}>{runInfo}</div>
        </div>

        <div className={styles.chips}>
          <button
            type="button"
            className={`${styles.chip} ${activeGroup === 'ALL' ? styles.chipActive : ''}`}
            onClick={() => setActiveGroup('ALL')}
          >
            All teams
          </button>
          {GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              className={`${styles.chip} ${activeGroup === group ? styles.chipActive : ''}`}
              onClick={() => setActiveGroup(group)}
            >
              Group {group}
            </button>
          ))}
        </div>

        <Wc2026ProbabilityTable
          teams={result.teams}
          simulationMode={simulationMode}
          activeGroup={activeGroup}
          showDelta={Boolean(result.hasBaselineComparison)}
        />

        <Wc2026MethodologyFooter
          result={result}
          simulationMode={simulationMode}
        />
      </div>
    </div>
  );
}
