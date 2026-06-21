import type { SimulationResult } from './types';

export function attachBaselineComparison(
  liveResult: SimulationResult,
  baselineResult: SimulationResult,
): SimulationResult {
  if (liveResult.mode !== 'live') {
    return liveResult;
  }

  const baselineByTeam = new Map(
    baselineResult.teams.map((team) => [team.teamId, team.probability]),
  );

  return {
    ...liveResult,
    hasBaselineComparison: true,
    teams: liveResult.teams.map((team) => {
      const baselineProbability = baselineByTeam.get(team.teamId) ?? 0;

      return {
        ...team,
        baselineProbability,
        probabilityDelta: team.probability - baselineProbability,
      };
    }),
  };
}
