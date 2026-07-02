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
import { compareTeamsByProbability } from './rankings';
import { getTeamMap, getTeamsByGroup } from './teams';
import type {
  GroupLetter,
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

// Stage progression tracked per team, indexed by "reached stage":
//   1 = reached R32 (advanced from group)
//   2 = reached R16 (won R32 match)
//   3 = reached QF (won R16 match)
//   4 = reached SF (won QF match)
//   5 = reached Final (won SF match)
//   6 = champion (won Final)
const STAGE_KEYS: StageKey[] = [
  'r32',
  'r16',
  'qf',
  'sf',
  'final',
  'champion',
];

const R32_ORDER = 1;
const THIRD_PLACE_ORDER = 5;
const FINAL_ORDER = 6;

// Third-place-team assignment table from FIFA's WC 2026 regulations.
// See https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
// Each string represents the group set for a third-place slot; the value
// is the ordered list of groups whose third-place finisher fills that slot,
// mapped by the number of third-place teams that advance (typically 8).
const THIRD_PLACE_SLOT_PRIORITY: Record<string, GroupLetter[]> = {
  '3ABCDF': ['A', 'B', 'C', 'D', 'F'],
  '3ACDEG': ['A', 'C', 'D', 'E', 'G'],
  '3ABEFG': ['A', 'B', 'E', 'F', 'G'],
  '3BEFGH': ['B', 'E', 'F', 'G', 'H'],
  '3CDFGH': ['C', 'D', 'F', 'G', 'H'],
  '3CEFHI': ['C', 'E', 'F', 'H', 'I'],
  '3EHIJK': ['E', 'H', 'I', 'J', 'K'],
  '3AEHIJ': ['A', 'E', 'H', 'I', 'J'],
  '3BEFIJ': ['B', 'E', 'F', 'I', 'J'],
  '3EFGIJ': ['E', 'F', 'G', 'I', 'J'],
  '3DEIJL': ['D', 'E', 'I', 'J', 'L'],
  '3ABCEF': ['A', 'B', 'C', 'E', 'F'],
  '3ABDEF': ['A', 'B', 'D', 'E', 'F'],
  '3DEFGH': ['D', 'E', 'F', 'G', 'H'],
};

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

// Returns the winner of a match, honoring penalty shootouts for tied knockout
// games. Group-stage draws still resolve to null (draws remain draws).
function getMatchWinner(match: MatchRecord): string | null {
  if (
    match.status !== 'finished' ||
    match.homeGoals === null ||
    match.awayGoals === null ||
    !match.homeTeamId ||
    !match.awayTeamId
  ) {
    return null;
  }

  if (match.homeGoals > match.awayGoals) {
    return match.homeTeamId;
  }

  if (match.awayGoals > match.homeGoals) {
    return match.awayTeamId;
  }

  if (match.stage === 'knockout') {
    const homePens = match.homePenaltyGoals;
    const awayPens = match.awayPenaltyGoals;

    if (
      typeof homePens === 'number' &&
      typeof awayPens === 'number' &&
      homePens !== awayPens
    ) {
      return homePens > awayPens ? match.homeTeamId : match.awayTeamId;
    }
  }

  return null;
}

function getMatchLoser(match: MatchRecord, winnerId: string): string | null {
  if (!match.homeTeamId || !match.awayTeamId) {
    return null;
  }
  return winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
}

function buildFinishedGroupMatchMap(
  snapshot: TournamentSnapshot,
): Map<string, MatchRecord> {
  const finished = new Map<string, MatchRecord>();

  for (const match of snapshot.matches) {
    if (
      match.status !== 'finished' ||
      match.stage !== 'group' ||
      !match.homeTeamId ||
      !match.awayTeamId
    ) {
      continue;
    }

    finished.set(getFixtureKey(match.homeTeamId, match.awayTeamId), match);
  }

  return finished;
}

function getKnockoutMatches(snapshot: TournamentSnapshot): MatchRecord[] {
  return snapshot.matches
    .filter((match) => match.stage === 'knockout')
    .sort((a, b) => {
      const numA = a.matchNumber ?? Number.MAX_SAFE_INTEGER;
      const numB = b.matchNumber ?? Number.MAX_SAFE_INTEGER;
      if (numA !== numB) {
        return numA - numB;
      }
      const roundDiff = knockoutRoundOrder(a.round) - knockoutRoundOrder(b.round);
      if (roundDiff !== 0) {
        return roundDiff;
      }
      return a.date.localeCompare(b.date);
    });
}

function findKnownChampion(snapshot: TournamentSnapshot): string | null {
  const finalMatches = snapshot.matches.filter(
    (match) =>
      match.status === 'finished' &&
      match.stage === 'knockout' &&
      knockoutRoundOrder(match.round) === FINAL_ORDER,
  );

  if (finalMatches.length === 0) {
    return null;
  }

  const finalMatch = finalMatches.sort((a, b) => b.date.localeCompare(a.date))[0];
  return getMatchWinner(finalMatch);
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
  const teamCounts = counts.get(teamId);
  if (!teamCounts) {
    return;
  }
  for (let s = 1; s <= stageIdx && s <= STAGE_KEYS.length; s += 1) {
    teamCounts[STAGE_KEYS[s - 1]] += 1;
  }
}

function computeGroupStandings(
  matchElos: Map<string, { group: number; knockout: number }>,
  mode: SimulationMode,
  random: () => number,
  finishedGroupMatches: Map<string, MatchRecord>,
  fixturesByGroup: ReturnType<typeof getFixturesByGroup>,
): Map<GroupLetter, GroupStanding[]> {
  const teamsByGroup = getTeamsByGroup();
  const standingsByGroup = new Map<GroupLetter, GroupStanding[]>();

  for (const group of getAllGroups()) {
    const groupTeams = teamsByGroup.get(group) ?? [];
    const standings = new Map<string, GroupStanding>(
      groupTeams.map((team) => [team.id, createStanding(team)]),
    );

    for (const fixture of fixturesByGroup.get(group) ?? []) {
      const key = getFixtureKey(fixture.homeTeamId, fixture.awayTeamId);
      const finished = finishedGroupMatches.get(key);

      if (
        finished &&
        finished.homeGoals !== null &&
        finished.awayGoals !== null &&
        finished.homeTeamId &&
        finished.awayTeamId
      ) {
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
    standingsByGroup.set(group, ranked);
  }

  return standingsByGroup;
}

function collectGroupAdvancers(
  standingsByGroup: Map<GroupLetter, GroupStanding[]>,
): GroupStanding[] {
  const advancers: GroupStanding[] = [];
  const thirdPlaces: GroupStanding[] = [];

  for (const ranked of standingsByGroup.values()) {
    if (ranked.length >= 1) advancers.push(ranked[0]);
    if (ranked.length >= 2) advancers.push(ranked[1]);
    if (ranked.length >= 3) thirdPlaces.push(ranked[2]);
  }

  advancers.push(...selectAdvancingThirdPlaces(thirdPlaces));
  return advancers;
}

// Builds a placeholder → teamId map from the current group standings so that
// R32 pairings expressed as "1A", "2B", "3ABCDF", etc. can be resolved.
function buildGroupPlaceholderMap(
  standingsByGroup: Map<GroupLetter, GroupStanding[]>,
): Map<string, string> {
  const map = new Map<string, string>();

  const thirds: GroupStanding[] = [];

  for (const [group, ranked] of standingsByGroup.entries()) {
    if (ranked[0]) map.set(`1${group}`, ranked[0].teamId);
    if (ranked[1]) map.set(`2${group}`, ranked[1].teamId);
    if (ranked[2]) thirds.push(ranked[2]);
  }

  const advancingThirds = selectAdvancingThirdPlaces(thirds);
  const advancingThirdIds = new Set(advancingThirds.map((s) => s.teamId));

  // FIFA sorts qualifying third-place teams into slots based on which groups
  // they belong to. We approximate using the published slot priority tables:
  // for each slot key like "3ABCDF", pick the first advancing third-place
  // team whose group appears in the priority list.
  const remaining = new Map<string, GroupStanding>();
  for (const third of advancingThirds) {
    remaining.set(third.group, third);
  }

  for (const [slotKey, priority] of Object.entries(THIRD_PLACE_SLOT_PRIORITY)) {
    for (const group of priority) {
      const candidate = remaining.get(group);
      if (candidate && advancingThirdIds.has(candidate.teamId)) {
        map.set(slotKey, candidate.teamId);
        remaining.delete(group);
        break;
      }
    }
  }

  return map;
}

function resolvePlaceholder(
  placeholder: string | null | undefined,
  groupPlaceholders: Map<string, string>,
  matchWinners: Map<number, string>,
  matchLosers: Map<number, string>,
): string | null {
  if (!placeholder) {
    return null;
  }

  const trimmed = placeholder.trim();

  const winMatch = trimmed.match(/^W(\d+)$/i);
  if (winMatch) {
    return matchWinners.get(Number.parseInt(winMatch[1], 10)) ?? null;
  }

  const runnerUpMatch = trimmed.match(/^(?:RU|L)(\d+)$/i);
  if (runnerUpMatch) {
    return matchLosers.get(Number.parseInt(runnerUpMatch[1], 10)) ?? null;
  }

  return groupPlaceholders.get(trimmed) ?? null;
}

// Approximate participation stage for a given round order.
//   R32 → reached R32 (stageIdx 1)
//   R16 → reached R16 (stageIdx 2)
//   QF  → reached QF  (stageIdx 3)
//   SF  → reached SF  (stageIdx 4)
//   Final → reached Final (stageIdx 5)
function participationStageForRound(order: number): number {
  return Math.max(1, Math.min(order, STAGE_KEYS.length - 1));
}

// After winning a match, a team advances one stage further.
function advancementStageForRound(order: number): number {
  return Math.min(order + 1, STAGE_KEYS.length);
}

type LiveKnockoutResult = {
  championId: string | null;
  stageReached: Map<string, number>;
  eliminated: Set<string>;
  advancers: Set<string>;
};

// Simulates the full knockout bracket using FIFA's published match numbering
// so that pairings match reality (e.g. Winner of Match 73 vs Winner of Match
// 75 in Round of 16). Finished matches are locked in (including penalty
// shootouts); unfinished matches are simulated with Elo.
function simulateKnockoutFromBracket(
  matchElos: Map<string, { group: number; knockout: number }>,
  random: () => number,
  knockoutMatches: MatchRecord[],
  groupPlaceholders: Map<string, string>,
): LiveKnockoutResult {
  const stageReached = new Map<string, number>();
  const eliminated = new Set<string>();
  const advancers = new Set<string>();
  const matchWinners = new Map<number, string>();
  const matchLosers = new Map<number, string>();
  let championId: string | null = null;

  for (const match of knockoutMatches) {
    const order = knockoutRoundOrder(match.round);

    const homeId: string | null =
      match.homeTeamId ??
      resolvePlaceholder(
        match.placeholderA,
        groupPlaceholders,
        matchWinners,
        matchLosers,
      );
    const awayId: string | null =
      match.awayTeamId ??
      resolvePlaceholder(
        match.placeholderB,
        groupPlaceholders,
        matchWinners,
        matchLosers,
      );

    if (!homeId || !awayId) {
      continue;
    }

    // Both teams reached this match; only track R32-Final for the stage
    // ladder, ignoring the 3rd-place playoff (which doesn't advance anyone).
    const participation = participationStageForRound(order);
    if (order !== THIRD_PLACE_ORDER) {
      advancers.add(homeId);
      advancers.add(awayId);
      recordStageReached(stageReached, homeId, participation);
      recordStageReached(stageReached, awayId, participation);
    }

    let winnerId: string;
    let loserId: string;

    if (match.status === 'finished') {
      const actualWinner = getMatchWinner(match);
      if (!actualWinner) {
        continue;
      }
      winnerId = actualWinner;
      loserId = actualWinner === homeId ? awayId : homeId;
    } else {
      const homeElo = matchElos.get(homeId)?.knockout;
      const awayElo = matchElos.get(awayId)?.knockout;
      if (typeof homeElo !== 'number' || typeof awayElo !== 'number') {
        continue;
      }
      const pick = sampleKnockoutWinner(homeElo, awayElo, random);
      winnerId = pick === 'A' ? homeId : awayId;
      loserId = pick === 'A' ? awayId : homeId;
    }

    if (match.matchNumber !== null) {
      matchWinners.set(match.matchNumber, winnerId);
      matchLosers.set(match.matchNumber, loserId);
    }

    if (order === THIRD_PLACE_ORDER) {
      // 3rd-place playoff does not affect the title path.
      continue;
    }

    // Winner advances to the next stage; loser is eliminated at this stage
    // (unless we're at the Final, in which case the loser is the runner-up).
    recordStageReached(
      stageReached,
      winnerId,
      advancementStageForRound(order),
    );
    eliminated.add(loserId);

    if (order === FINAL_ORDER) {
      championId = winnerId;
    }
  }

  return { championId, stageReached, eliminated, advancers };
}

function simulateKnockoutFromAdvancers(
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

// Determines teams that are already eliminated from the perspective of the
// snapshot: knocked out in a finished knockout match (including penalties)
// or unable to advance from a group that has fully concluded.
function getEliminatedFromSnapshot(
  snapshot: TournamentSnapshot,
): Set<string> {
  const eliminated = new Set<string>();

  for (const match of snapshot.matches) {
    if (match.status !== 'finished' || match.stage !== 'knockout') {
      continue;
    }
    const winner = getMatchWinner(match);
    if (!winner) {
      continue;
    }
    const loser = getMatchLoser(match, winner);
    if (loser) {
      eliminated.add(loser);
    }
  }

  // Teams that never appear in any R32 match are group-stage-eliminated,
  // provided the R32 bracket is fully drawn.
  const r32Matches = snapshot.matches.filter(
    (match) =>
      match.stage === 'knockout' &&
      knockoutRoundOrder(match.round) === R32_ORDER,
  );

  if (r32Matches.length === 0) {
    return eliminated;
  }

  const teamsInR32 = new Set<string>();
  for (const match of r32Matches) {
    if (match.homeTeamId) teamsInR32.add(match.homeTeamId);
    if (match.awayTeamId) teamsInR32.add(match.awayTeamId);
  }

  // Only mark as eliminated if the R32 bracket is fully populated — otherwise
  // some teams might still be pending resolution from the group stage.
  const r32HasAllTeams = r32Matches.every(
    (match) => match.homeTeamId && match.awayTeamId,
  );

  if (!r32HasAllTeams) {
    return eliminated;
  }

  const teamMap = getTeamMap();
  for (const team of teamMap.values()) {
    if (!teamsInR32.has(team.id)) {
      eliminated.add(team.id);
    }
  }

  return eliminated;
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
    .sort(compareTeamsByProbability);

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
    .sort(compareTeamsByProbability);
}

export function runMonteCarlo(
  iterations = DEFAULT_ITERATIONS,
  seed?: string,
  simulationMode: SimulationMode = 'serious',
  snapshot?: TournamentSnapshot | null,
): SimulationResult {
  const resolvedSeed = seed ?? getSeedForMode(simulationMode);
  const knownChampion = snapshot ? findKnownChampion(snapshot) : null;
  const eliminated = snapshot
    ? getEliminatedFromSnapshot(snapshot)
    : new Set<string>();

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

  const finishedGroupMatches = snapshot
    ? buildFinishedGroupMatchMap(snapshot)
    : new Map<string, MatchRecord>();
  const fixturesByGroup = getFixturesByGroup();
  const knockoutMatches = snapshot ? getKnockoutMatches(snapshot) : [];
  const useLiveKnockout = knockoutMatches.length > 0;

  for (let i = 0; i < iterations; i += 1) {
    const standingsByGroup = computeGroupStandings(
      matchElos,
      simulationMode,
      random,
      finishedGroupMatches,
      fixturesByGroup,
    );

    let championId: string | null = null;
    const iterationStageReached = new Map<string, number>();

    if (useLiveKnockout) {
      const groupPlaceholders = buildGroupPlaceholderMap(standingsByGroup);
      const live = simulateKnockoutFromBracket(
        matchElos,
        random,
        knockoutMatches,
        groupPlaceholders,
      );

      championId = live.championId;

      for (const [teamId, stageIdx] of live.stageReached) {
        recordStageReached(iterationStageReached, teamId, stageIdx);
      }
    } else {
      const advancers = collectGroupAdvancers(standingsByGroup);
      for (const advancer of advancers) {
        recordStageReached(iterationStageReached, advancer.teamId, 1);
      }

      const { championId: legacyChamp, stageReached: legacyStage } =
        simulateKnockoutFromAdvancers(advancers, matchElos, random);
      championId = legacyChamp;
      for (const [teamId, stageIdx] of legacyStage) {
        recordStageReached(iterationStageReached, teamId, stageIdx);
      }
    }

    if (!championId || eliminated.has(championId)) {
      continue;
    }

    winCounts.set(championId, (winCounts.get(championId) ?? 0) + 1);

    for (const [teamId, stageIdx] of iterationStageReached) {
      accumulateStageCounts(stageCounts, teamId, stageIdx);
    }
  }

  const totalWins = [...winCounts.values()].reduce(
    (sum, wins) => sum + wins,
    0,
  );

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
