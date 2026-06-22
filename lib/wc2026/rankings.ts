import type { TeamProbability } from './types';

export function compareTeamsByProbability(
  a: TeamProbability,
  b: TeamProbability,
): number {
  if (b.probability !== a.probability) {
    return b.probability - a.probability;
  }
  return a.name.localeCompare(b.name);
}

export function sortTeamsByProbability(
  teams: TeamProbability[],
): TeamProbability[] {
  return [...teams].sort(compareTeamsByProbability);
}

/** Top teams by title probability; prefers active teams, else full ranked list. */
export function getTopTeamsByProbability(
  teams: TeamProbability[],
  count: number,
): TeamProbability[] {
  const sorted = sortTeamsByProbability(teams);
  const active = sorted.filter((team) => !team.eliminated);
  const pool = active.length > 0 ? active : sorted;
  return pool.slice(0, count);
}

export function assertTeamsSortedByProbability(
  teams: TeamProbability[],
): boolean {
  for (let i = 1; i < teams.length; i += 1) {
    if (teams[i].probability > teams[i - 1].probability) {
      return false;
    }
  }
  return true;
}
