import { runMonteCarlo, DEFAULT_ITERATIONS } from './simulate';

const result = runMonteCarlo(DEFAULT_ITERATIONS);

console.log('=== WC2026 Monte Carlo Sanity Check ===\n');
console.log(`Mode: ${result.mode}`);
console.log(`Iterations: ${result.iterations}`);
console.log(`Total probability: ${(result.totalProbability * 100).toFixed(2)}%`);
console.log(`Teams: ${result.teams.length}`);

const totalOk = Math.abs(result.totalProbability - 1) < 0.001;
console.log(`Sum to ~100%: ${totalOk ? 'PASS' : 'FAIL'}`);

console.log('\nTop 10:');
for (const team of result.teams.slice(0, 10)) {
  console.log(
    `  ${team.name.padEnd(24)} ${(team.probability * 100).toFixed(2).padStart(6)}%  Elo ${Math.round(team.adjustedElo)}`,
  );
}


console.log('\nSatirical adjustments:');
console.log(`  USA adjusted Elo: ${result.teams.find((t) => t.teamId === 'USA')?.adjustedElo}`);
console.log(`  ARG rank: #${result.teams.findIndex((t) => t.teamId === 'ARG') + 1}`);

const start = performance.now();
runMonteCarlo(DEFAULT_ITERATIONS);
const elapsed = performance.now() - start;
console.log(`\nPerformance: ${elapsed.toFixed(0)}ms for ${DEFAULT_ITERATIONS} iterations`);
console.log(`Performance OK (<1000ms): ${elapsed < 1000 ? 'PASS' : 'FAIL'}`);

if (!totalOk) {
  process.exit(1);
}
