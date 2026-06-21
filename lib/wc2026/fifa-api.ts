import {
  getGroupForTeam,
  isGroupStageRound,
  isKnockoutRound,
} from './fixtures';
import { mapApiTeamToId } from './team-mapping';
import type { GroupLetter, MatchRecord, MatchStatus, TournamentSnapshot } from './types';

const FIFA_BASE = 'https://api.fifa.com/api/v3';
const WORLD_CUP_COMPETITION_ID = '17';
const WORLD_CUP_SEASON_ID = '285023';

const STAGE_ROUND: Record<string, string> = {
  '289273': 'First Stage',
  '289287': 'Round of 32',
  '289288': 'Round of 16',
  '289289': 'Quarter-final',
  '289290': 'Semi-final',
  '289291': 'Play-off for third place',
  '289292': 'Final',
};

type FifaLocalizedText = {
  Locale?: string;
  Description?: string;
};

type FifaTeam = {
  IdCountry?: string;
  Abbreviation?: string;
  Score?: number | null;
  TeamName?: FifaLocalizedText[];
  ShortClubName?: string;
};

type FifaMatch = {
  IdMatch: string;
  IdStage?: string | number;
  Date: string;
  MatchStatus: number;
  MatchTime?: string | null;
  StageName?: FifaLocalizedText[];
  GroupName?: FifaLocalizedText[];
  Home?: FifaTeam | null;
  Away?: FifaTeam | null;
  HomeTeamScore?: number | null;
  AwayTeamScore?: number | null;
};

type FifaCalendarResponse = {
  Results?: FifaMatch[];
};

function localizedText(values?: FifaLocalizedText[]): string {
  if (!values || values.length === 0) {
    return '';
  }

  const english = values.find((value) =>
    value.Locale?.toLowerCase()?.startsWith('en'),
  );

  return english?.Description ?? values[0].Description ?? '';
}

function mapFifaStatus(match: FifaMatch): MatchStatus {
  if (match.MatchStatus === 0) {
    return 'finished';
  }

  if (match.MatchStatus === 3) {
    return 'live';
  }

  if (match.MatchTime || match.Home?.Score != null || match.Away?.Score != null) {
    return 'live';
  }

  return 'scheduled';
}

function extractGroup(match: FifaMatch): GroupLetter | undefined {
  const groupText = localizedText(match.GroupName);
  const matchGroup = groupText.match(/Group\s+([A-L])/i);
  return matchGroup ? (matchGroup[1].toUpperCase() as GroupLetter) : undefined;
}

function buildRound(match: FifaMatch): string {
  const stageId = String(match.IdStage ?? '');
  const stageRound = STAGE_ROUND[stageId];
  const group = extractGroup(match);

  if (group) {
    return `${stageRound || localizedText(match.StageName)} · Group ${group}`;
  }

  return stageRound || localizedText(match.StageName) || 'Knockout';
}

function mapFifaTeam(team: FifaTeam | null | undefined): string | null {
  if (!team?.IdCountry) {
    return null;
  }

  const name =
    localizedText(team.TeamName) || team.ShortClubName || team.IdCountry;

  return mapApiTeamToId(team.IdCountry, name);
}

function normalizeFifaMatch(match: FifaMatch): MatchRecord | null {
  const homeTeamId = mapFifaTeam(match.Home);
  const awayTeamId = mapFifaTeam(match.Away);

  if (!homeTeamId || !awayTeamId) {
    return null;
  }

  const round = buildRound(match);
  const stage = isGroupStageRound(round)
    ? 'group'
    : isKnockoutRound(round)
      ? 'knockout'
      : getGroupForTeam(homeTeamId)
        ? 'group'
        : 'knockout';

  return {
    id: Number.parseInt(match.IdMatch, 10),
    homeTeamId,
    awayTeamId,
    homeGoals: match.HomeTeamScore ?? match.Home?.Score ?? null,
    awayGoals: match.AwayTeamScore ?? match.Away?.Score ?? null,
    status: mapFifaStatus(match),
    stage,
    group: extractGroup(match) ?? getGroupForTeam(homeTeamId),
    round,
    date: match.Date,
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
  const url = new URL(`${FIFA_BASE}/calendar/matches`);
  url.searchParams.set('idCompetition', WORLD_CUP_COMPETITION_ID);
  url.searchParams.set('idSeason', WORLD_CUP_SEASON_ID);
  url.searchParams.set('count', '500');
  url.searchParams.set('language', 'en');

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'its-called-football/1.0 (wc2026 probabilities)',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `FIFA API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as FifaCalendarResponse | null;
  const responseList = Array.isArray(payload?.Results) ? payload.Results : [];

  if (responseList.length === 0) {
    console.warn('[wc2026] FIFA API returned no matches');

    return {
      ...createEmptySnapshot(),
      warning: 'FIFA API returned no matches for World Cup 2026.',
    };
  }

  const matches = responseList
    .map(normalizeFifaMatch)
    .filter((match): match is MatchRecord => match !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    fetchedAt: new Date().toISOString(),
    source: 'fifa',
    matches,
    finishedCount: matches.filter((match) => match.status === 'finished')
      .length,
    liveCount: matches.filter((match) => match.status === 'live').length,
  };
}
