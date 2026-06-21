import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { WC2026_CACHE_TAG, syncLiveTournamentData } from '@/lib/wc2026/live-data';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV === 'development';
  }

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await syncLiveTournamentData();

    revalidateTag(WC2026_CACHE_TAG, 'max');
    revalidatePath('/wc2026');

    return NextResponse.json({
      ok: true,
      fetchedAt: snapshot.fetchedAt,
      source: snapshot.source,
      finishedCount: snapshot.finishedCount,
      liveCount: snapshot.liveCount,
      matchCount: snapshot.matches.length,
    });
  } catch (error) {
    console.error('[wc2026] Cron sync failed:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 },
    );
  }
}
