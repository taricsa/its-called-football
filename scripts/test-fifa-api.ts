import { fetchTournamentSnapshot } from '../lib/wc2026/fifa-api';

async function main() {
  try {
    const snapshot = await fetchTournamentSnapshot();

    const report = {
      ok: snapshot.source === 'fifa',
      source: snapshot.source,
      matchCount: snapshot.matches.length,
      finishedCount: snapshot.finishedCount,
      liveCount: snapshot.liveCount,
      fetchedAt: snapshot.fetchedAt,
      warning: snapshot.warning ?? null,
      sampleFinished: snapshot.matches
        .filter((match) => match.status === 'finished')
        .slice(0, 3)
        .map((match) => ({
          home: match.homeTeamId,
          away: match.awayTeamId,
          score: `${match.homeGoals}-${match.awayGoals}`,
          round: match.round,
        })),
    };

    console.log(JSON.stringify(report, null, 2));

    if (!report.ok) {
      process.exit(1);
    }
  } catch (error) {
    console.error(
      'API_ERROR:',
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main();
