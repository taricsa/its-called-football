import {
  getAdjustedElo,
  sampleGoals,
  sampleGroupMatch,
  sampleKnockoutWinner,
} from './elo';
import {
  getFixtureKey,
  getGroupFixtures,
  knockoutRoundOrder,
} from './fixtures';
import {
  getAllGroups,
  rankGroupStandings,
  seedKnockoutTeams,
  selectAdvancingThirdPlaces,
} from './format';
import { getTeamMap, getTeamsByGroup } from './teams';
import type {
  GroupStanding,
  MatchRecord,
  SimulationResult,
  Team,
  TeamProbability,
  TournamentSnapshot,
} from './types';

const DEFAULT_ITERATIONS = 10_000;
const DEFAULT_SEED = 'wc2026-linguistic-justice';

function createSeededRandom(seed: string): () => number {
  let state = 0;

  for (let i = 0; i < seed.length; i += 1) {
    state = (state + seed.charCodeAt(i) * (i + 1)) >>> 0;
  }

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createStanding(team: Team): GroupStanding {
  return {
    teamId: team.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    position: 4,
    group: team.group,
  };
}

function applyMatchResult(
  standings: Map<string, GroupStanding>,
  homeId: string,
  awayId: string,
  homeGoals: number,
  awayGoals: number,
): void {
  const home = standings.get(homeId)!;
  const away = standings.get(awayId)!;

  home.played += 1;
  away.played += 1;
  home.goalsFor += homeGoals;
  home.goalsAgainst += awayGoals;
  away.goalsFor += awayGoals;
  away.goalsAgainst += homeGoals;

  if (homeGoals > awayGoals) {
    home.won += 1;
    home.points += 3;
    away.lost += 1;
    return;
  }

  if (awayGoals > homeGoals) {
    away.won += 1;
    away.points += 3;
    home.lost += 1;
    return;
  }

  home.drawn += 1;
  away.drawn += 1;
  home.points += 1;
  away.points += 1;
}

function getMatchWinner(
  match: MatchRecord,
): string | null {
  if (
    match.homeGoals === null ||
    match.awayGoals === null ||
    match.status !== 'finished'
  ) {
    return null;
  }

  if (match.homeGoals > match.awayGoals) {
    return match.homeTeamId;
  }

  if (match.awayGoals > match.homeGoals) {
    return match.awayTeamId;
  }

  return null;
}

function buildFinishedMatchMap(
  snapshot: TournamentSnapshot,
): Map<string, MatchRecord> {
  const finished = new Map<string, MatchRecord>();

  for (const match of snapshot.matches) {
    if (match.status !== 'finished') {
      continue;
    }

    finished.set(getFixtureKey(match.homeTeamId, match.awayTeamId), match);
  }

  return finished;
}

function findKnownChampion(snapshot: TournamentSnapshot): string | null {
  const finalMatches = snapshot.matches.filter(
    (match) =>
      match.status === 'finished' &&
      match.stage === 'knockout' &&
      match.round.toLowerCase().includes('final') &&
      !match.round.toLowerCase().includes('semi') &&
      !match.round.toLowerCase().includes('quarter') &&
      !match.round.toLowerCase().includes('3rd') &&
      !match.round.toLowerCase().includes('third'),
  );

  if (finalMatches.length === 0) {
    return null;
  }

  const finalMatch = finalMatches.sort((a, b) => b.date.localeCompare(a.date))[0];
  return getMatchWinner(finalMatch);
}

function getEliminatedFromSnapshot(snapshot: TournamentSnapshot): Set<string> {
  const eliminated = new Set<string>();

  for (const match of snapshot.matches) {
    if (match.status !== 'finished' || match.stage !== 'knockout') {
      continue;
    }

    const winner = getMatchWinner(match);
    if (!winner) {
      continue;
    }

    const loser =
      winner === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    eliminated.add(loser);
  }

  return eliminated;
}

import type { GroupLetter } from './types';

function countFinishedGroupMatches(
  group: GroupLetter,
  finishedMatches: Map<string, MatchRecord>,
): number {
  return getGroupFixtures().filter((fixture) => {
    if (fixture.group !== group) {
      return false;
    }

    return finishedMatches.has(
      getFixtureKey(fixture.homeTeamId, fixture.awayTeamId),
    );
  }).length;
}

function simulateGroupStage(
  adjustedElos: Map<string, number>,
  random: () => number,
  finishedMatches: Map<string, MatchRecord>,
): GroupStanding[] {
  const advancers: GroupStanding[] = [];
  const thirdPlaces: GroupStanding[] = [];

  for (const group of getAllGroups()) {
    const groupTeams = getTeamsByGroup().get(group) ?? [];
    const standings = new Map<string, GroupStanding>(
      groupTeams.map((team) => [team.id, createStanding(team)]),
    );

    for (const fixture of getGroupFixtures().filter(
      (entry) => entry.group === group,
    )) {
      const key = getFixtureKey(fixture.homeTeamId, fixture.awayTeamId);
      const finished = finishedMatches.get(key);

      if (finished && finished.homeGoals !== null && finished.awayGoals !== null) {
        applyMatchResult(
          standings,
          finished.homeTeamId,
          finished.awayTeamId,
          finished.homeGoals,
          finished.awayGoals,
        );
        continue;
      }

      if (countFinishedGroupMatches(group, finishedMatches) === 6) {
        continue;
      }

      const home = fixture.homeTeamId;
      const away = fixture.awayTeamId;
      const outcome = sampleGroupMatch(
        adjustedElos.get(home)!,
        adjustedElos.get(away)!,
        random,
      );
      const goals = sampleGoals(outcome, random);
      applyMatchResult(standings, home, away, goals.home, goals.away);
    }

    const ranked = rankGroupStandings(
      standings,
      groupTeams.map((team) => team.id),
    );

    advancers.push(ranked[0], ranked[1]);
    thirdPlaces.push(ranked[2]);
  }

  advancers.push(...selectAdvancingThirdPlaces(thirdPlaces));
  return advancers;
}

function simulateKnockoutRound(
  advancers: GroupStanding[],
  adjustedElos: Map<string, number>,
  random: () => number,
): string {
  let teams = seedKnockoutTeams(advancers);

  while (teams.length > 1) {
    const nextRound: string[] = [];

    for (let i = 0; i < teams.length; i += 2) {
      const teamA = teams[i];
      const teamB = teams[i + 1];
      const winner = sampleKnockoutWinner(
        adjustedElos.get(teamA)!,
        adjustedElos.get(teamB)!,
        random,
      );
      nextRound.push(winner === 'A' ? teamA : teamB);
    }

    teams = nextRound;
  }

  return teams[0];
}

function simulateKnockoutFromSnapshot(
  advancers: string[],
  adjustedElos: Map<string, number>,
  random: () => number,
  snapshot: TournamentSnapshot,
): string {
  const activeTeams = new Set(advancers);
  const knockoutMatches = snapshot.matches
    .filter((match) => match.stage === 'knockout')
    .sort((a, b) => {
      const roundDiff = knockoutRoundOrder(a.round) - knockoutRoundOrder(b.round);
      if (roundDiff !== 0) {
        return roundDiff;
      }

      return a.date.localeCompare(b.date);
    });

  const rounds = new Map<number, MatchRecord[]>();

  for (const match of knockoutMatches) {
    const order = knockoutRoundOrder(match.round);
    const existing = rounds.get(order) ?? [];
    existing.push(match);
    rounds.set(order, existing);
  }

  if (rounds.size === 0) {
    const standings = advancers.map((teamId) => ({
      teamId,
      played: 3,
      won: 1,
      drawn: 0,
      lost: 0,
      goalsFor: 1,
      goalsAgainst: 0,
      points: 3,
      position: 1 as const,
      group: getTeamMap().get(teamId)!.group,
    }));

    return simulateKnockoutRound(standings, adjustedElos, random);
  }

  for (const order of [...rounds.keys()].sort((a, b) => a - b)) {
    const roundMatches = rounds.get(order)!;

    for (const match of roundMatches) {
      if (
        !activeTeams.has(match.homeTeamId) &&
        !activeTeams.has(match.awayTeamId)
      ) {
        continue;
      }

      if (match.status === 'finished') {
        const winner = getMatchWinner(match);
        if (!winner) {
          continue;
        }

        const loser =
          winner === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
        activeTeams.delete(loser);
        continue;
      }

      if (
        !activeTeams.has(match.homeTeamId) ||
        !activeTeams.has(match.awayTeamId)
      ) {
        continue;
      }

      const winner = sampleKnockoutWinner(
        adjustedElos.get(match.homeTeamId)!,
        adjustedElos.get(match.awayTeamId)!,
        random,
      );
      const winnerId =
        winner === 'A' ? match.homeTeamId : match.awayTeamId;
      const loserId =
        winner === 'A' ? match.awayTeamId : match.homeTeamId;
      activeTeams.delete(loserId);

      if (order === knockoutRoundOrder('Final')) {
        return winnerId;
      }
    }
  }

  const survivors = [...activeTeams];
  if (survivors.length === 1) {
    return survivors[0];
  }

  if (survivors.length === 0) {
    return simulateKnockoutRound(
      advancers.map((teamId) => ({
        teamId,
        played: 3,
        won: 1,
        drawn: 0,
        lost: 0,
        goalsFor: 1,
        goalsAgainst: 0,
        points: 3,
        position: 1 as const,
        group: getTeamMap().get(teamId)!.group,
      })),
      adjustedElos,
      random,
    );
  }

  while (survivors.length > 1) {
    const nextRound: string[] = [];

    for (let i = 0; i < survivors.length; i += 2) {
      if (i + 1 >= survivors.length) {
        nextRound.push(survivors[i]);
        continue;
      }

      const teamA = survivors[i];
      const teamB = survivors[i + 1];
      const winner = sampleKnockoutWinner(
        adjustedElos.get(teamA)!,
        adjustedElos.get(teamB)!,
        random,
      );
      nextRound.push(winner === 'A' ? teamA : teamB);
    }

    survivors.splice(0, survivors.length, ...nextRound);
  }

  return survivors[0];
}

function simulateTournament(
  adjustedElos: Map<string, number>,
  random: () => number,
  snapshot?: TournamentSnapshot,
): string {
  const finishedMatches = snapshot
    ? buildFinishedMatchMap(snapshot)
    : new Map<string, MatchRecord>();

  const advancers = simulateGroupStage(adjustedElos, random, finishedMatches);

  if (snapshot && snapshot.finishedCount > 0) {
    return simulateKnockoutFromSnapshot(
      advancers.map((standing) => standing.teamId),
      adjustedElos,
      random,
      snapshot,
    );
  }

  return simulateKnockoutRound(advancers, adjustedElos, random);
}

function buildChampionResult(
  championId: string,
  iterations: number,
  snapshot: TournamentSnapshot | null,
  eliminated: Set<string>,
): SimulationResult {
  const teamMap = getTeamMap();
  const teams = [...teamMap.values()];
  const adjustedElos = new Map(
    teams.map((team) => [team.id, getAdjustedElo(team)]),
  );

  const teamProbabilities: TeamProbability[] = teams
    .map((team) => ({
      teamId: team.id,
      name: team.name,
      group: team.group,
      baseElo: team.baseElo,
      adjustedElo: adjustedElos.get(team.id)!,
      satiricalNote: team.satiricalNote,
      adjustments: team.adjustments,
      wins: team.id === championId ? iterations : 0,
      probability: team.id === championId ? 1 : 0,
      eliminated: team.id !== championId,
    }))
    .sort((a, b) => b.probability - a.probability);

  return {
    iterations,
    teams: teamProbabilities,
    totalProbability: 1,
    snapshot,
    mode: snapshot && snapshot.finishedCount > 0 ? 'live' : 'pre-tournament',
  };
}

export function runMonteCarlo(
  iterations = DEFAULT_ITERATIONS,
  seed = DEFAULT_SEED,
  snapshot?: TournamentSnapshot | null,
): SimulationResult {
  const knownChampion = snapshot ? findKnownChampion(snapshot) : null;
  const eliminated = snapshot ? getEliminatedFromSnapshot(snapshot) : new Set<string>();

  if (knownChampion) {
    return buildChampionResult(knownChampion, iterations, snapshot ?? null, eliminated);
  }

  const random = createSeededRandom(seed);
  const teamMap = getTeamMap();
  const teams = [...teamMap.values()];
  const adjustedElos = new Map(
    teams.map((team) => [team.id, getAdjustedElo(team)]),
  );
  const winCounts = new Map<string, number>(
    teams.map((team) => [team.id, 0]),
  );

  for (let i = 0; i < iterations; i += 1) {
    const championId = simulateTournament(
      adjustedElos,
      random,
      snapshot ?? undefined,
    );

    if (eliminated.has(championId)) {
      continue;
    }

    winCounts.set(championId, (winCounts.get(championId) ?? 0) + 1);
  }

  const totalWins = [...winCounts.values()].reduce((sum, wins) => sum + wins, 0);
  const effectiveIterations = totalWins > 0 ? totalWins : iterations;

  const teamProbabilities: TeamProbability[] = teams
    .map((team) => {
      const wins = winCounts.get(team.id) ?? 0;
      return {
        teamId: team.id,
        name: team.name,
        group: team.group,
        baseElo: team.baseElo,
        adjustedElo: adjustedElos.get(team.id)!,
        satiricalNote: team.satiricalNote,
        adjustments: team.adjustments,
        wins,
        probability: totalWins > 0 ? wins / totalWins : wins / effectiveIterations,
        eliminated: eliminated.has(team.id),
      };
    })
    .sort((a, b) => b.probability - a.probability);

  const totalProbability = teamProbabilities.reduce(
    (sum, team) => sum + team.probability,
    0,
  );

  return {
    iterations,
    teams: teamProbabilities,
    totalProbability,
    snapshot: snapshot ?? null,
    mode: snapshot && snapshot.finishedCount > 0 ? 'live' : 'pre-tournament',
  };
}

export { DEFAULT_ITERATIONS };
