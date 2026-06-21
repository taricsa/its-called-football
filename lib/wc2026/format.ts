import type { GroupLetter, GroupStanding } from './types';

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

export function getGroupPairings(): [number, number][] {
  return [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
    [2, 3],
  ];
}

export function rankGroupStandings(
  standings: Map<string, GroupStanding>,
  teamIds: string[],
): GroupStanding[] {
  return teamIds
    .map((teamId) => standings.get(teamId)!)
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) {
        return gdB - gdA;
      }

      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }

      return a.teamId.localeCompare(b.teamId);
    })
    .map((standing, index) => ({
      ...standing,
      position: (index + 1) as 1 | 2 | 3 | 4,
    }));
}

export function selectAdvancingThirdPlaces(
  thirdPlaces: GroupStanding[],
): GroupStanding[] {
  return [...thirdPlaces]
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) {
        return gdB - gdA;
      }

      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }

      return a.teamId.localeCompare(b.teamId);
    })
    .slice(0, 8);
}

export function seedKnockoutTeams(advancers: GroupStanding[]): string[] {
  return [...advancers]
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) {
        return gdB - gdA;
      }

      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }

      if (a.position !== b.position) {
        return a.position - b.position;
      }

      return a.teamId.localeCompare(b.teamId);
    })
    .map((standing) => standing.teamId);
}

export function getAllGroups(): GroupLetter[] {
  return GROUPS;
}
