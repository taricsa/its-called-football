import { unstable_cache } from 'next/cache';
import { createEmptySnapshot, fetchTournamentSnapshot } from './api-football';
import type { TournamentSnapshot } from './types';

export const WC2026_CACHE_TAG = 'wc2026-live-data';

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
    revalidate: 300,
    tags: [WC2026_CACHE_TAG],
  },
);

export async function syncLiveTournamentData(): Promise<TournamentSnapshot> {
  const snapshot = await loadTournamentSnapshot();
  return snapshot;
}
