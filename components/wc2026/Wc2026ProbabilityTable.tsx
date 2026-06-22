'use client';

import { useMemo, useState } from 'react';
import type { GroupLetter, SimulationMode, TeamProbability } from '@/lib/wc2026/types';
import styles from './wc2026.module.css';

type SortKey =
  | 'rank'
  | 'name'
  | 'group'
  | 'elo'
  | 'r32'
  | 'qf'
  | 'sf'
  | 'final'
  | 'champion'
  | 'delta';

type Wc2026ProbabilityTableProps = {
  teams: TeamProbability[];
  simulationMode: SimulationMode;
  activeGroup: GroupLetter | 'ALL';
  showDelta: boolean;
};

function formatPct(value: number, isProbability = false): string {
  const pct = value * 100;
  if (pct < 0.05 && isProbability) {
    return '<0.1';
  }
  if (pct < 0.01) {
    return '0.0';
  }
  return pct.toFixed(1);
}

function formatDelta(delta: number | undefined): string {
  if (delta === undefined) {
    return '—';
  }

  const points = delta * 100;

  if (Math.abs(points) < 0.05) {
    return '0.0%';
  }

  const sign = points > 0 ? '+' : '';
  return `${sign}${points.toFixed(1)}%`;
}

export default function Wc2026ProbabilityTable({
  teams,
  simulationMode,
  activeGroup,
  showDelta,
}: Wc2026ProbabilityTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('champion');
  const [sortDir, setSortDir] = useState(-1);

  const filteredTeams = useMemo(() => {
    if (activeGroup === 'ALL') {
      return teams;
    }
    return teams.filter((team) => team.group === activeGroup);
  }, [activeGroup, teams]);

  const sortedTeams = useMemo(() => {
    const sorted = [...filteredTeams];

    sorted.sort((a, b) => {
      let va: string | number;
      let vb: string | number;

      switch (sortKey) {
        case 'name':
          va = a.name;
          vb = b.name;
          break;
        case 'group':
          va = a.group;
          vb = b.group;
          break;
        case 'elo':
          va = a.adjustedElo;
          vb = b.adjustedElo;
          break;
        case 'r32':
          va = a.r32;
          vb = b.r32;
          break;
        case 'qf':
          va = a.qf;
          vb = b.qf;
          break;
        case 'sf':
          va = a.sf;
          vb = b.sf;
          break;
        case 'final':
          va = a.final;
          vb = b.final;
          break;
        case 'delta':
          va = a.probabilityDelta ?? 0;
          vb = b.probabilityDelta ?? 0;
          break;
        case 'champion':
        default:
          va = a.probability;
          vb = b.probability;
          break;
      }

      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir * va.localeCompare(vb);
      }

      return sortDir * ((va as number) - (vb as number));
    });

    return sorted;
  }, [filteredTeams, sortDir, sortKey]);

  const maxChampion = useMemo(
    () => Math.max(0.001, ...teams.map((team) => team.probability)),
    [teams],
  );

  const handleSort = (key: SortKey) => {
    if (key === 'rank') {
      return;
    }

    if (sortKey === key) {
      setSortDir((current) => current * -1);
      return;
    }

    setSortKey(key);
    const isTextCol = key === 'name' || key === 'group';
    setSortDir(isTextCol ? 1 : -1);
  };

  const renderArrow = (key: SortKey) => {
    if (sortKey !== key) {
      return null;
    }

    return (
      <span style={{ opacity: 0.5, fontSize: '0.6rem' }}>
        {sortDir === -1 ? ' ▼' : ' ▲'}
      </span>
    );
  };

  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th} onClick={() => handleSort('rank')}>
              #{renderArrow('rank')}
            </th>
            <th className={styles.th} onClick={() => handleSort('name')}>
              Team{renderArrow('name')}
            </th>
            <th className={styles.th} onClick={() => handleSort('group')}>
              Grp{renderArrow('group')}
            </th>
            <th
              className={`${styles.th} ${styles.optCol}`}
              onClick={() => handleSort('elo')}
            >
              Elo{renderArrow('elo')}
            </th>
            <th
              className={`${styles.th} ${styles.optCol}`}
              onClick={() => handleSort('r32')}
            >
              R32%{renderArrow('r32')}
            </th>
            <th
              className={`${styles.th} ${styles.optCol}`}
              onClick={() => handleSort('qf')}
            >
              QF%{renderArrow('qf')}
            </th>
            <th
              className={`${styles.th} ${styles.optCol}`}
              onClick={() => handleSort('sf')}
            >
              SF%{renderArrow('sf')}
            </th>
            <th
              className={`${styles.th} ${styles.optCol}`}
              onClick={() => handleSort('final')}
            >
              Final%{renderArrow('final')}
            </th>
            <th className={styles.th} onClick={() => handleSort('champion')}>
              Title%{renderArrow('champion')}
            </th>
            {showDelta && simulationMode === 'serious' && (
              <th
                className={`${styles.th} ${styles.optCol}`}
                onClick={() => handleSort('delta')}
              >
                Δ{renderArrow('delta')}
              </th>
            )}
            {simulationMode === 'satirical' && (
              <th className={`${styles.th} ${styles.optCol}`}>Verdict</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedTeams.map((team, index) => {
            const isLead =
              sortKey === 'champion' &&
              sortDir === -1 &&
              index === 0 &&
              activeGroup === 'ALL';
            const barWidth = Math.max(
              1.5,
              (team.probability / maxChampion) * 100,
            );
            const eliminated = team.eliminated;

            return (
              <tr
                key={team.teamId}
                className={isLead ? styles.leadRow : undefined}
              >
                <td className={styles.td}>{index + 1}</td>
                <td className={styles.td}>
                  <div
                    className={`${styles.teamCell} ${eliminated ? styles.eliminated : ''}`}
                  >
                    <span>{team.teamId}</span>
                    {team.name}
                  </div>
                </td>
                <td className={`${styles.td} ${styles.grpCell}`}>
                  {team.group}
                </td>
                <td className={`${styles.td} ${styles.numCell} ${styles.optCol}`}>
                  {Math.round(team.adjustedElo)}
                </td>
                <td className={`${styles.td} ${styles.numCell} ${styles.optCol}`}>
                  {eliminated ? '0.0%' : `${formatPct(team.r32)}%`}
                </td>
                <td className={`${styles.td} ${styles.numCell} ${styles.optCol}`}>
                  {eliminated ? '0.0%' : `${formatPct(team.qf)}%`}
                </td>
                <td className={`${styles.td} ${styles.numCell} ${styles.optCol}`}>
                  {eliminated ? '0.0%' : `${formatPct(team.sf)}%`}
                </td>
                <td className={`${styles.td} ${styles.numCell} ${styles.optCol}`}>
                  {eliminated ? '0.0%' : `${formatPct(team.final)}%`}
                </td>
                <td className={`${styles.td} ${styles.barCell}`}>
                  <div className={styles.barRow}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${eliminated ? 0 : barWidth}%` }}
                      />
                    </div>
                    <div
                      className={`${styles.barPct} ${eliminated ? styles.eliminated : ''}`}
                    >
                      {eliminated
                        ? '0.0%'
                        : `${formatPct(team.probability, true)}%`}
                    </div>
                  </div>
                </td>
                {showDelta && simulationMode === 'serious' && (
                  <td
                    className={`${styles.td} ${styles.numCell} ${styles.optCol} ${
                      team.probabilityDelta === undefined
                        ? ''
                        : team.probabilityDelta >= 0.0005
                          ? styles.deltaUp
                          : team.probabilityDelta <= -0.0005
                            ? styles.deltaDown
                            : ''
                    }`}
                  >
                    {formatDelta(team.probabilityDelta)}
                  </td>
                )}
                {simulationMode === 'satirical' && (
                  <td
                    className={`${styles.td} ${styles.verdictCell} ${styles.optCol}`}
                  >
                    {team.satiricalNote}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
