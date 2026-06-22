import {
  DEFAULT_ITERATIONS,
  getSeedForMode,
  runMonteCarlo,
} from './simulate';
import type { SimulationMode, SimulationResult, TournamentSnapshot } from './types';

export function runMonteCarloChunked(
  iterations = DEFAULT_ITERATIONS,
  simulationMode: SimulationMode = 'serious',
  snapshot: TournamentSnapshot | null = null,
  onProgress?: (completed: number, total: number) => void,
): Promise<{ result: SimulationResult; elapsedMs: number }> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    onProgress?.(0, iterations);

    setTimeout(() => {
      const result = runMonteCarlo(
        iterations,
        getSeedForMode(simulationMode),
        simulationMode,
        snapshot,
      );
      onProgress?.(iterations, iterations);
      resolve({ result, elapsedMs: performance.now() - t0 });
    }, 0);
  });
}
