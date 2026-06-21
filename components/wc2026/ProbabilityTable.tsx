'use client';

import { useMemo, useState } from 'react';
import type { TeamProbability } from '@/lib/wc2026/types';
import type { ThemeVariant } from '@/types/theme';

type SortKey = 'probability' | 'name' | 'group' | 'elo';

type ProbabilityTableProps = {
  teams: TeamProbability[];
  variant: ThemeVariant;
};

function formatPercent(probability: number): string {
  if (probability >= 0.01) {
    return `${(probability * 100).toFixed(1)}%`;
  }

  return `${(probability * 100).toFixed(2)}%`;
}

export default function ProbabilityTable({
  teams,
  variant,
}: ProbabilityTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('probability');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedTeams = useMemo(() => {
    const sorted = [...teams];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'probability':
          comparison = a.probability - b.probability;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'group':
          comparison =
            a.group.localeCompare(b.group) || a.probability - b.probability;
          break;
        case 'elo':
          comparison = a.adjustedElo - b.adjustedElo;
          break;
      }

      return sortAsc ? comparison : -comparison;
    });

    return sorted;
  }, [teams, sortAsc, sortKey]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((current) => !current);
      return;
    }

    setSortKey(key);
    setSortAsc(key === 'name' || key === 'group');
  };

  const isCourt = variant === 'court';

  const headerClass = isCourt
    ? 'font-sans text-[10px] font-bold uppercase tracking-wider text-zinc-500'
    : 'font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500';

  const rowClass = isCourt
    ? 'border-b border-zinc-100 hover:bg-stone-50'
    : 'border-b border-zinc-800/80 hover:bg-zinc-900/60';

  const cellClass = isCourt
    ? 'px-3 py-3 font-sans text-sm text-zinc-700'
    : 'px-3 py-3 font-mono text-xs text-zinc-300';

  const sortButtonClass = isCourt
    ? 'cursor-pointer select-none transition hover:text-zinc-900'
    : 'cursor-pointer select-none transition hover:text-emerald-400';

  return (
    <div
      className={
        isCourt
          ? 'overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm'
          : 'overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950'
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead
            className={
              isCourt
                ? 'border-b border-zinc-200 bg-stone-50'
                : 'border-b border-zinc-800 bg-zinc-900'
            }
          >
            <tr>
              <th className={`${headerClass} px-3 py-3`}>Rank</th>
              <th
                className={`${headerClass} ${sortButtonClass} px-3 py-3`}
                onClick={() => handleSort('name')}
              >
                Team
              </th>
              <th
                className={`${headerClass} ${sortButtonClass} px-3 py-3`}
                onClick={() => handleSort('group')}
              >
                Group
              </th>
              <th
                className={`${headerClass} ${sortButtonClass} px-3 py-3`}
                onClick={() => handleSort('elo')}
              >
                Elo
              </th>
              <th
                className={`${headerClass} ${sortButtonClass} px-3 py-3`}
                onClick={() => handleSort('probability')}
              >
                Win Prob.
              </th>
              <th className={`${headerClass} px-3 py-3`}>Linguistic Verdict</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, index) => (
              <tr key={team.teamId} className={rowClass}>
                <td className={`${cellClass} font-bold text-zinc-400`}>
                  {index + 1}
                </td>
                <td className={`${cellClass} font-bold`}>
                  <span className="mr-2 text-zinc-400">{team.teamId}</span>
                  {team.name}
                </td>
                <td className={cellClass}>{team.group}</td>
                <td className={cellClass}>
                  {Math.round(team.adjustedElo)}
                  {team.adjustedElo !== team.baseElo && (
                    <span className="ml-1 text-[10px] text-zinc-400">
                      ({team.baseElo})
                    </span>
                  )}
                </td>
                <td
                  className={`${cellClass} ${
                    team.eliminated
                      ? isCourt
                        ? 'text-zinc-300 line-through'
                        : 'text-zinc-600 line-through'
                      : isCourt
                        ? 'font-bold text-emerald-700'
                        : 'font-black text-emerald-400'
                  }`}
                >
                  {team.eliminated ? '0.0%' : formatPercent(team.probability)}
                </td>
                <td
                  className={`${cellClass} max-w-xs text-[11px] leading-relaxed text-zinc-500`}
                >
                  {team.satiricalNote}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
