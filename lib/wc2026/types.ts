export type GroupLetter =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L';

export type SatiricalAdjustment =
  | 'terminology_bonus'
  | 'hand_egg_penalty'
  | 'host_advantage'
  | 'traitor_penalty';

export type Team = {
  id: string;
  name: string;
  group: GroupLetter;
  baseElo: number;
  satiricalNote: string;
  adjustments: SatiricalAdjustment[];
};

export type GroupStanding = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: 1 | 2 | 3 | 4;
  group: GroupLetter;
};

export type TeamProbability = {
  teamId: string;
  name: string;
  group: GroupLetter;
  baseElo: number;
  adjustedElo: number;
  satiricalNote: string;
  adjustments: SatiricalAdjustment[];
  wins: number;
  probability: number;
  baselineProbability?: number;
  probabilityDelta?: number;
  eliminated?: boolean;
};

export type MatchStage = 'group' | 'knockout';

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export type MatchRecord = {
  id: number;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: MatchStatus;
  stage: MatchStage;
  group?: GroupLetter;
  round: string;
  date: string;
};

export type TournamentSnapshot = {
  fetchedAt: string;
  source: 'fifa' | 'none';
  matches: MatchRecord[];
  finishedCount: number;
  liveCount: number;
  warning?: string;
};

export type SimulationResult = {
  iterations: number;
  teams: TeamProbability[];
  totalProbability: number;
  snapshot: TournamentSnapshot | null;
  mode: 'live' | 'pre-tournament';
  hasBaselineComparison?: boolean;
};

export type MatchOutcome = 'home_win' | 'draw' | 'away_win';

export type FixturePair = {
  homeTeamId: string;
  awayTeamId: string;
  group: GroupLetter;
};
