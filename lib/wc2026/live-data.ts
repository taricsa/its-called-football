import { unstable_cache } from 'next/cache';
import { createEmptySnapshot, fetchTournamentSnapshot } from './fifa-api';
import { runMonteCarlo } from './simulate';
import type { SimulationResult, TournamentSnapshot } from './types';

const BASELINE_REVALIDATE_SECONDS = 60 * 60 * 24 * 30;

export const WC2026_CACHE_TAG = 'wc2026-live-data';
export const WC2026_REVALIDATE_SECONDS = 120;

async function loadTournamentSnapshot(): Promise<TournamentSnapshot> {
  try {
    return await fetchTournamentSnapshot();
  } catch (error) {
    console.error('[wc2026] Failed to fetch live tournament data:', error);
    return createEmptySnapshot();
  }
}

export const getLiveTournamentSnapshot = unstable_cache(
  loadTournamentSnapshot,
  ['wc2026-tournament-snapshot'],
  {
    revalidate: WC2026_REVALIDATE_SECONDS,
    tags: [WC2026_CACHE_TAG],
  },
);

export async function syncLiveTournamentData(): Promise<TournamentSnapshot> {
  const snapshot = await loadTournamentSnapshot();
  return snapshot;
}

export const getPreTournamentBaseline = unstable_cache(
  async (): Promise<SimulationResult> =>
    runMonteCarlo(undefined, undefined, 'serious', null),
  ['wc2026-pre-tournament-baseline'],
  { revalidate: BASELINE_REVALIDATE_SECONDS },
);
