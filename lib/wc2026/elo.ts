import type {
  MatchContext,
  MatchOutcome,
  SatiricalAdjustment,
  SimulationMode,
  Team,
} from './types';

const TERMINOLOGY_BONUS = 15;
const HAND_EGG_PENALTY = -50;
const HOST_ADVANTAGE = 10;
const TRAITOR_PENALTY = -15;
const SERIOUS_HOST_BONUS = 100;

const HOST_NATIONS = new Set(['CAN', 'MEX', 'USA']);

export function getAdjustmentDelta(adjustments: SatiricalAdjustment[]): number {
  let delta = 0;

  for (const adjustment of adjustments) {
    switch (adjustment) {
      case 'terminology_bonus':
        delta += TERMINOLOGY_BONUS;
        break;
      case 'hand_egg_penalty':
        delta += HAND_EGG_PENALTY;
        break;
      case 'host_advantage':
        delta += HOST_ADVANTAGE;
        break;
      case 'traitor_penalty':
        delta += TRAITOR_PENALTY;
        break;
    }
  }

  return delta;
}

export function getAdjustedElo(team: Team): number {
  return team.baseElo + getAdjustmentDelta(team.adjustments);
}

export function getMatchElo(
  team: Team,
  mode: SimulationMode,
  context: MatchContext,
): number {
  if (mode === 'satirical') {
    return getAdjustedElo(team);
  }

  if (context === 'group' && HOST_NATIONS.has(team.id)) {
    return team.baseElo + SERIOUS_HOST_BONUS;
  }

  return team.baseElo;
}

export function getDisplayElo(team: Team, mode: SimulationMode): number {
  if (mode === 'satirical') {
    return getAdjustedElo(team);
  }

  return team.baseElo;
}

export function winProbability(eloA: number, eloB: number): number {
  return 1 / (1 + 10 ** ((eloB - eloA) / 400));
}

function matchProbsSerious(eloA: number, eloB: number) {
  const diff = eloA - eloB;
  const pWinNoDraw = winProbability(eloA, eloB);
  const pDraw = 0.3 * Math.exp(-(diff * diff) / (2 * 300 * 300));
  return {
    pA: (1 - pDraw) * pWinNoDraw,
    pDraw,
    pB: (1 - pDraw) * (1 - pWinNoDraw),
  };
}

export function sampleKnockoutWinner(
  eloA: number,
  eloB: number,
  random: () => number,
): 'A' | 'B' {
  return random() < winProbability(eloA, eloB) ? 'A' : 'B';
}

export function sampleGroupMatch(
  eloA: number,
  eloB: number,
  random: () => number,
  mode: SimulationMode = 'serious',
): MatchOutcome {
  if (mode === 'serious') {
    const { pA, pDraw, pB } = matchProbsSerious(eloA, eloB);
    const roll = random();

    if (roll < pA) {
      return 'home_win';
    }

    if (roll < pA + pDraw) {
      return 'draw';
    }

    if (roll < pA + pDraw + pB) {
      return 'away_win';
    }

    return 'away_win';
  }

  const winA = winProbability(eloA, eloB);
  const drawRate = 0.25;
  const adjustedWinA = winA * (1 - drawRate);
  const adjustedWinB = (1 - winA) * (1 - drawRate);
  const roll = random();

  if (roll < adjustedWinA) {
    return 'home_win';
  }

  if (roll < adjustedWinA + drawRate) {
    return 'draw';
  }

  if (roll < adjustedWinA + drawRate + adjustedWinB) {
    return 'away_win';
  }

  return 'away_win';
}

export function sampleGoals(
  outcome: MatchOutcome,
  random: () => number,
): { home: number; away: number } {
  const base = Math.floor(random() * 3);

  switch (outcome) {
    case 'home_win':
      return {
        home: base + 1,
        away: Math.floor(random() * (base + 1)),
      };
    case 'away_win':
      return {
        home: Math.floor(random() * (base + 1)),
        away: base + 1,
      };
    case 'draw':
      return {
        home: base,
        away: base,
      };
  }
}
