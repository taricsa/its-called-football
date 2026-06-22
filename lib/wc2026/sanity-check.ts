import {
  assertTeamsSortedByProbability,
  getTopTeamsByProbability,
} from './rankings';
import { runMonteCarlo, DEFAULT_ITERATIONS } from './simulate';

console.log('=== WC2026 Monte Carlo Sanity Check ===\n');

for (const mode of ['serious', 'satirical'] as const) {
  const result = runMonteCarlo(DEFAULT_ITERATIONS, undefined, mode);

  console.log(`--- ${mode.toUpperCase()} MODE ---`);
  console.log(`Tournament mode: ${result.mode}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Total probability: ${(result.totalProbability * 100).toFixed(2)}%`);
  console.log(`Teams: ${result.teams.length}`);

  const totalOk = Math.abs(result.totalProbability - 1) < 0.001;
  console.log(`Sum to ~100%: ${totalOk ? 'PASS' : 'FAIL'}`);

  const sortedOk = assertTeamsSortedByProbability(result.teams);
  console.log(`Teams sorted by probability: ${sortedOk ? 'PASS' : 'FAIL'}`);

  const topTeam = getTopTeamsByProbability(result.teams, 1)[0];
  console.log(
    `Top team: ${topTeam.name} ${(topTeam.probability * 100).toFixed(2)}% (R32 ${(topTeam.r32 * 100).toFixed(1)}%)`,
  );

  const r32Ok = result.teams.every((team) => team.r32 >= team.probability - 0.001);
  console.log(`R32 >= Title for all teams: ${r32Ok ? 'PASS' : 'FAIL'}`);

  if (mode === 'satirical') {
    console.log(`USA adjusted Elo: ${result.teams.find((t) => t.teamId === 'USA')?.adjustedElo}`);
  }

  if (!totalOk || !sortedOk || !r32Ok) {
    process.exit(1);
  }
}

const start = performance.now();
runMonteCarlo(DEFAULT_ITERATIONS, undefined, 'serious');
const elapsed = performance.now() - start;
console.log(`\nPerformance: ${elapsed.toFixed(0)}ms for ${DEFAULT_ITERATIONS} serious iterations`);
console.log(`Performance OK (<1500ms): ${elapsed < 1500 ? 'PASS' : 'FAIL'}`);
