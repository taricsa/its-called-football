import {
  getGroupForTeam,
  isGroupStageRound,
  isKnockoutRound,
} from './fixtures';
import { mapApiTeamToId } from './team-mapping';
import type { GroupLetter, MatchRecord, MatchStatus, TournamentSnapshot } from './types';

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
    };
  };
  league: {
    round: string;
  };
  teams: {
    home: {
      name: string;
      code: string | null;
    };
    away: {
      name: string;
      code: string | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type ApiFootballResponse = {
  response: ApiFootballFixture[];
};

function mapStatus(short: string): MatchStatus {
  if (short === 'FT' || short === 'AET' || short === 'PEN') {
    return 'finished';
  }

  if (short === 'NS' || short === 'TBD' || short === 'PST' || short === 'CANC') {
    return 'scheduled';
  }

  return 'live';
}

function extractGroup(round: string): GroupLetter | undefined {
  const match = round.match(/Group\s+([A-L])/i);
  return match ? (match[1].toUpperCase() as GroupLetter) : undefined;
}

function normalizeFixture(fixture: ApiFootballFixture): MatchRecord | null {
  const homeTeamId = mapApiTeamToId(
    fixture.teams.home.code,
    fixture.teams.home.name,
  );
  const awayTeamId = mapApiTeamToId(
    fixture.teams.away.code,
    fixture.teams.away.name,
  );

  if (!homeTeamId || !awayTeamId) {
    return null;
  }

  const round = fixture.league.round;
  const stage = isGroupStageRound(round)
    ? 'group'
    : isKnockoutRound(round)
      ? 'knockout'
      : getGroupForTeam(homeTeamId)
        ? 'group'
        : 'knockout';

  return {
    id: fixture.fixture.id,
    homeTeamId,
    awayTeamId,
    homeGoals: fixture.goals.home,
    awayGoals: fixture.goals.away,
    status: mapStatus(fixture.fixture.status.short),
    stage,
    group: extractGroup(round) ?? getGroupForTeam(homeTeamId),
    round,
    date: fixture.fixture.date,
  };
}

export function createEmptySnapshot(): TournamentSnapshot {
  return {
    fetchedAt: new Date().toISOString(),
    source: 'none',
    matches: [],
    finishedCount: 0,
    liveCount: 0,
  };
}

export async function fetchTournamentSnapshot(): Promise<TournamentSnapshot> {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return createEmptySnapshot();
  }

  const url = new URL(`${API_FOOTBALL_BASE}/fixtures`);
  url.searchParams.set('league', String(WORLD_CUP_LEAGUE_ID));
  url.searchParams.set('season', String(WORLD_CUP_SEASON));

  const response = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `API-Football request failed: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as ApiFootballResponse;
  const responseList = Array.isArray(payload.response) ? payload.response : [];

  if (responseList.length === 0 && payload.response !== undefined) {
    console.warn('[wc2026] API-Football returned unexpected response shape');
  }

  const matches = responseList
    .map(normalizeFixture)
    .filter((match): match is MatchRecord => match !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    fetchedAt: new Date().toISOString(),
    source: 'api-football',
    matches,
    finishedCount: matches.filter((match) => match.status === 'finished')
      .length,
    liveCount: matches.filter((match) => match.status === 'live').length,
  };
}
