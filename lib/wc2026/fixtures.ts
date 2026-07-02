import { getTeamsByGroup } from './teams';
import type { FixturePair, GroupLetter } from './types';

const GROUP_PAIRINGS: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
];

let groupFixturesCache: FixturePair[] | null = null;

export function getGroupFixtures(): FixturePair[] {
  if (!groupFixturesCache) {
    const fixtures: FixturePair[] = [];

    for (const [group, teams] of getTeamsByGroup()) {
      for (const [homeIndex, awayIndex] of GROUP_PAIRINGS) {
        fixtures.push({
          homeTeamId: teams[homeIndex].id,
          awayTeamId: teams[awayIndex].id,
          group,
        });
      }
    }

    groupFixturesCache = fixtures;
  }

  return groupFixturesCache;
}

let fixturesByGroupCache: Map<GroupLetter, FixturePair[]> | null = null;

export function getFixturesByGroup(): Map<GroupLetter, FixturePair[]> {
  if (!fixturesByGroupCache) {
    const fixturesByGroup = new Map<GroupLetter, FixturePair[]>();

    for (const fixture of getGroupFixtures()) {
      const existing = fixturesByGroup.get(fixture.group) ?? [];
      existing.push(fixture);
      fixturesByGroup.set(fixture.group, existing);
    }

    fixturesByGroupCache = fixturesByGroup;
  }

  return fixturesByGroupCache;
}

export function getFixtureKey(homeTeamId: string, awayTeamId: string): string {
  return [homeTeamId, awayTeamId].sort().join(':');
}

export function getGroupForTeam(teamId: string): GroupLetter | undefined {
  for (const [group, teams] of getTeamsByGroup()) {
    if (teams.some((team) => team.id === teamId)) {
      return group;
    }
  }

  return undefined;
}

export function isGroupStageRound(round: string): boolean {
  return round.toLowerCase().includes('group');
}

export function isKnockoutRound(round: string): boolean {
  const normalized = round.toLowerCase();
  return (
    normalized.includes('round of') ||
    normalized.includes('quarter') ||
    normalized.includes('semi') ||
    normalized.includes('final') ||
    normalized.includes('third place') ||
    normalized.includes('3rd place') ||
    normalized.includes('play-off for third')
  );
}

export function knockoutRoundOrder(round: string): number {
  const normalized = round.toLowerCase();

  if (normalized.includes('round of 32') || normalized.includes('1/16')) {
    return 1;
  }

  if (normalized.includes('round of 16') || normalized.includes('1/8')) {
    return 2;
  }

  if (normalized.includes('quarter')) {
    return 3;
  }

  if (normalized.includes('semi')) {
    return 4;
  }

  if (normalized.includes('3rd place') || normalized.includes('third place')) {
    return 5;
  }

  if (normalized.includes('final')) {
    return 6;
  }

  return 99;
}
