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

type BracketEntry = { teamId: string; group: GroupLetter };

function shuffle<T>(arr: T[], random: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildBracketPairs(
  advancers: GroupStanding[],
  random: () => number,
): [string, string][] {
  const entries: BracketEntry[] = advancers.map((standing) => ({
    teamId: standing.teamId,
    group: standing.group,
  }));

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const shuffled = shuffle(entries, random);
    const pairs: [string, string][] = [];
    let ok = true;

    for (let i = 0; i < shuffled.length; i += 2) {
      if (shuffled[i].group === shuffled[i + 1].group) {
        ok = false;
        break;
      }
      pairs.push([shuffled[i].teamId, shuffled[i + 1].teamId]);
    }

    if (ok) {
      return pairs;
    }
  }

  const seeded = seedKnockoutTeams(advancers);
  const pairs: [string, string][] = [];
  for (let i = 0; i < seeded.length; i += 2) {
    pairs.push([seeded[i], seeded[i + 1]]);
  }
  return pairs;
}
