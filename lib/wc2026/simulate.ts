import {
  getDisplayElo,
  getMatchElo,
  sampleGoals,
  sampleGroupMatch,
  sampleKnockoutWinner,
} from './elo';
import {
  buildBracketPairs,
  getAllGroups,
  rankGroupStandings,
  selectAdvancingThirdPlaces,
} from './format';
import {
  getFixtureKey,
  getFixturesByGroup,
  knockoutRoundOrder,
} from './fixtures';
import { getTeamMap, getTeamsByGroup } from './teams';
import type {
  GroupStanding,
  MatchRecord,
  SimulationMode,
  SimulationResult,
  StageCounts,
  StageKey,
  Team,
  TeamProbability,
  TournamentSnapshot,
} from './types';

const DEFAULT_ITERATIONS = 10_000;
const SERIOUS_SEED = 'wc2026-serious';
const SATIRICAL_SEED = 'wc2026-linguistic-justice';

const STAGE_KEYS: StageKey[] = [
  'r32',
  'r16',
  'qf',
  'sf',
  'final',
  'champion',
];

function createEmptyStageCounts(): StageCounts {
  return {
    r32: 0,
    r16: 0,
    qf: 0,
    sf: 0,
    final: 0,
    champion: 0,
  };
}

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

function getSeedForMode(mode: SimulationMode): string {
  return mode === 'satirical' ? SATIRICAL_SEED : SERIOUS_SEED;
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

function getMatchWinner(match: MatchRecord): string | null {
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

function buildKnockoutRounds(
  snapshot: TournamentSnapshot,
): Map<number, MatchRecord[]> {
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

  return rounds;
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

function buildMatchElos(
  teams: Team[],
  mode: SimulationMode,
): Map<string, { group: number; knockout: number }> {
  return new Map(
    teams.map((team) => [
      team.id,
      {
        group: getMatchElo(team, mode, 'group'),
        knockout: getMatchElo(team, mode, 'knockout'),
      },
    ]),
  );
}

function recordStageReached(
  stageReached: Map<string, number>,
  teamId: string,
  stageIdx: number,
): void {
  const current = stageReached.get(teamId) ?? 0;
  if (stageIdx > current) {
    stageReached.set(teamId, stageIdx);
  }
}

function accumulateStageCounts(
  counts: Map<string, StageCounts>,
  teamId: string,
  stageIdx: number,
): void {
  const teamCounts = counts.get(teamId)!;
  for (let s = 1; s <= stageIdx; s += 1) {
    teamCounts[STAGE_KEYS[s - 1]] += 1;
  }
}

function simulateGroupStage(
  matchElos: Map<string, { group: number; knockout: number }>,
  mode: SimulationMode,
  random: () => number,
  finishedMatches: Map<string, MatchRecord>,
  fixturesByGroup: ReturnType<typeof getFixturesByGroup>,
): GroupStanding[] {
  const advancers: GroupStanding[] = [];
  const thirdPlaces: GroupStanding[] = [];
  const teamsByGroup = getTeamsByGroup();

  for (const group of getAllGroups()) {
    const groupTeams = teamsByGroup.get(group) ?? [];
    const standings = new Map<string, GroupStanding>(
      groupTeams.map((team) => [team.id, createStanding(team)]),
    );

    for (const fixture of fixturesByGroup.get(group) ?? []) {
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

      const home = fixture.homeTeamId;
      const away = fixture.awayTeamId;
      const outcome = sampleGroupMatch(
        matchElos.get(home)!.group,
        matchElos.get(away)!.group,
        random,
        mode,
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
  matchElos: Map<string, { group: number; knockout: number }>,
  random: () => number,
): { championId: string; stageReached: Map<string, number> } {
  const stageReached = new Map<string, number>();

  for (const advancer of advancers) {
    recordStageReached(stageReached, advancer.teamId, 1);
  }

  const initialPairs = buildBracketPairs(advancers, random);
  let currentRoundWinners = initialPairs.map(([idA, idB]) => {
    const winner = sampleKnockoutWinner(
      matchElos.get(idA)!.knockout,
      matchElos.get(idB)!.knockout,
      random,
    );
    const winnerId = winner === 'A' ? idA : idB;
    recordStageReached(stageReached, winnerId, 2);
    return winnerId;
  });

  let stageIdx = 2;
  while (currentRoundWinners.length > 1) {
    const nextRoundWinners: string[] = [];
    stageIdx += 1;

    for (let i = 0; i < currentRoundWinners.length; i += 2) {
      const teamAId = currentRoundWinners[i];
      const teamBId = currentRoundWinners[i + 1];
      const winner = sampleKnockoutWinner(
        matchElos.get(teamAId)!.knockout,
        matchElos.get(teamBId)!.knockout,
        random,
      );
      const winnerId = winner === 'A' ? teamAId : teamBId;
      nextRoundWinners.push(winnerId);
      recordStageReached(stageReached, winnerId, stageIdx);
    }

    currentRoundWinners = nextRoundWinners;
  }

  const championId = currentRoundWinners[0];
  recordStageReached(stageReached, championId, STAGE_KEYS.length);
  return { championId, stageReached };
}

function knockoutOrderToStageIdx(order: number): number {
  if (order <= 0 || order > 5) {
    return order;
  }
  return order;
}

function stageIdxForSurvivorRound(survivorCount: number): number {
  return 7 - Math.ceil(Math.log2(survivorCount));
}

function simulateKnockoutFromSnapshot(
  advancers: string[],
  matchElos: Map<string, { group: number; knockout: number }>,
  random: () => number,
  rounds: Map<number, MatchRecord[]>,
): { championId: string; stageReached: Map<string, number> } {
  const stageReached = new Map<string, number>();
  const activeTeams = new Set(advancers);

  for (const teamId of advancers) {
    recordStageReached(stageReached, teamId, 1);
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

    return simulateKnockoutRound(standings, matchElos, random);
  }

  for (const order of [...rounds.keys()].sort((a, b) => a - b)) {
    const roundMatches = rounds.get(order)!;
    const stageIdx = knockoutOrderToStageIdx(order) + 1;

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
        recordStageReached(stageReached, winner, stageIdx);
        continue;
      }

      if (
        !activeTeams.has(match.homeTeamId) ||
        !activeTeams.has(match.awayTeamId)
      ) {
        continue;
      }

      const winner = sampleKnockoutWinner(
        matchElos.get(match.homeTeamId)!.knockout,
        matchElos.get(match.awayTeamId)!.knockout,
        random,
      );
      const winnerId =
        winner === 'A' ? match.homeTeamId : match.awayTeamId;
      const loserId =
        winner === 'A' ? match.awayTeamId : match.homeTeamId;
      activeTeams.delete(loserId);
      recordStageReached(stageReached, winnerId, stageIdx);

      if (order === knockoutRoundOrder('Final')) {
        recordStageReached(stageReached, winnerId, STAGE_KEYS.length);
        return { championId: winnerId, stageReached };
      }
    }
  }

  const survivors = [...activeTeams];
  if (survivors.length === 1) {
    recordStageReached(stageReached, survivors[0], STAGE_KEYS.length);
    return { championId: survivors[0], stageReached };
  }

  if (survivors.length === 0) {
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

    return simulateKnockoutRound(standings, matchElos, random);
  }

  while (survivors.length > 1) {
    const stageIdx = stageIdxForSurvivorRound(survivors.length);
    const nextRound: string[] = [];

    for (let i = 0; i < survivors.length; i += 2) {
      if (i + 1 >= survivors.length) {
        nextRound.push(survivors[i]);
        continue;
      }

      const teamA = survivors[i];
      const teamB = survivors[i + 1];
      const winner = sampleKnockoutWinner(
        matchElos.get(teamA)!.knockout,
        matchElos.get(teamB)!.knockout,
        random,
      );
      const winnerId = winner === 'A' ? teamA : teamB;
      nextRound.push(winnerId);
      recordStageReached(stageReached, winnerId, stageIdx);
    }

    survivors.splice(0, survivors.length, ...nextRound);
  }

  recordStageReached(stageReached, survivors[0], STAGE_KEYS.length);
  return { championId: survivors[0], stageReached };
}

function simulateTournament(
  matchElos: Map<string, { group: number; knockout: number }>,
  mode: SimulationMode,
  random: () => number,
  finishedMatches: Map<string, MatchRecord>,
  fixturesByGroup: ReturnType<typeof getFixturesByGroup>,
  knockoutRounds: Map<number, MatchRecord[]>,
  useLiveKnockout: boolean,
): { championId: string; stageReached: Map<string, number> } {
  const advancers = simulateGroupStage(
    matchElos,
    mode,
    random,
    finishedMatches,
    fixturesByGroup,
  );

  if (useLiveKnockout) {
    return simulateKnockoutFromSnapshot(
      advancers.map((standing) => standing.teamId),
      matchElos,
      random,
      knockoutRounds,
    );
  }

  return simulateKnockoutRound(advancers, matchElos, random);
}

function buildChampionResult(
  championId: string,
  iterations: number,
  simulationMode: SimulationMode,
  snapshot: TournamentSnapshot | null,
  eliminated: Set<string>,
): SimulationResult {
  const teamMap = getTeamMap();
  const teams = [...teamMap.values()];

  const teamProbabilities: TeamProbability[] = teams
    .map((team) => ({
      teamId: team.id,
      name: team.name,
      group: team.group,
      baseElo: team.baseElo,
      adjustedElo: getDisplayElo(team, simulationMode),
      satiricalNote: team.satiricalNote,
      adjustments: team.adjustments,
      wins: team.id === championId ? iterations : 0,
      probability: team.id === championId ? 1 : 0,
      r32: team.id === championId ? 1 : 0,
      r16: team.id === championId ? 1 : 0,
      qf: team.id === championId ? 1 : 0,
      sf: team.id === championId ? 1 : 0,
      final: team.id === championId ? 1 : 0,
      eliminated: eliminated.has(team.id) && team.id !== championId,
    }))
    .sort((a, b) => b.probability - a.probability);

  return {
    iterations,
    teams: teamProbabilities,
    totalProbability: 1,
    snapshot,
    mode: snapshot && snapshot.finishedCount > 0 ? 'live' : 'pre-tournament',
    simulationMode,
  };
}

function buildTeamProbabilities(
  teams: Team[],
  stageCounts: Map<string, StageCounts>,
  winCounts: Map<string, number>,
  iterations: number,
  totalWins: number,
  simulationMode: SimulationMode,
  eliminated: Set<string>,
): TeamProbability[] {
  const effectiveIterations = totalWins > 0 ? totalWins : iterations;

  return teams
    .map((team) => {
      const wins = winCounts.get(team.id) ?? 0;
      const counts = stageCounts.get(team.id)!;
      const isEliminated = eliminated.has(team.id);

      return {
        teamId: team.id,
        name: team.name,
        group: team.group,
        baseElo: team.baseElo,
        adjustedElo: getDisplayElo(team, simulationMode),
        satiricalNote: team.satiricalNote,
        adjustments: team.adjustments,
        wins,
        probability: isEliminated
          ? 0
          : totalWins > 0
            ? wins / totalWins
            : wins / effectiveIterations,
        r32: isEliminated ? 0 : counts.r32 / effectiveIterations,
        r16: isEliminated ? 0 : counts.r16 / effectiveIterations,
        qf: isEliminated ? 0 : counts.qf / effectiveIterations,
        sf: isEliminated ? 0 : counts.sf / effectiveIterations,
        final: isEliminated ? 0 : counts.final / effectiveIterations,
        eliminated: isEliminated,
      };
    })
    .sort((a, b) => b.probability - a.probability);
}

export function runMonteCarlo(
  iterations = DEFAULT_ITERATIONS,
  seed?: string,
  simulationMode: SimulationMode = 'serious',
  snapshot?: TournamentSnapshot | null,
): SimulationResult {
  const resolvedSeed = seed ?? getSeedForMode(simulationMode);
  const knownChampion = snapshot ? findKnownChampion(snapshot) : null;
  const eliminated = snapshot ? getEliminatedFromSnapshot(snapshot) : new Set<string>();

  if (knownChampion) {
    return buildChampionResult(
      knownChampion,
      iterations,
      simulationMode,
      snapshot ?? null,
      eliminated,
    );
  }

  const random = createSeededRandom(resolvedSeed);
  const teamMap = getTeamMap();
  const teams = [...teamMap.values()];
  const matchElos = buildMatchElos(teams, simulationMode);
  const stageCounts = new Map<string, StageCounts>(
    teams.map((team) => [team.id, createEmptyStageCounts()]),
  );
  const winCounts = new Map<string, number>(
    teams.map((team) => [team.id, 0]),
  );

  const finishedMatches = snapshot
    ? buildFinishedMatchMap(snapshot)
    : new Map<string, MatchRecord>();
  const fixturesByGroup = getFixturesByGroup();
  const knockoutRounds = snapshot
    ? buildKnockoutRounds(snapshot)
    : new Map<number, MatchRecord[]>();
  const useLiveKnockout = Boolean(snapshot && snapshot.finishedCount > 0);

  for (let i = 0; i < iterations; i += 1) {
    const { championId, stageReached } = simulateTournament(
      matchElos,
      simulationMode,
      random,
      finishedMatches,
      fixturesByGroup,
      knockoutRounds,
      useLiveKnockout,
    );

    if (eliminated.has(championId)) {
      continue;
    }

    winCounts.set(championId, (winCounts.get(championId) ?? 0) + 1);

    for (const [teamId, stageIdx] of stageReached) {
      accumulateStageCounts(stageCounts, teamId, stageIdx);
    }
  }

  const totalWins = [...winCounts.values()].reduce((sum, wins) => sum + wins, 0);

  const teamProbabilities = buildTeamProbabilities(
    teams,
    stageCounts,
    winCounts,
    iterations,
    totalWins,
    simulationMode,
    eliminated,
  );

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
    simulationMode,
  };
}

export {
  DEFAULT_ITERATIONS,
  SERIOUS_SEED,
  SATIRICAL_SEED,
  getSeedForMode,
};
