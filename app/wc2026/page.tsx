import { Bebas_Neue, IBM_Plex_Mono, Inter } from 'next/font/google';
import { headers } from 'next/headers';
import MetricQuizModal from '@/components/blocker/MetricQuizModal';
import Wc2026Dashboard from '@/components/wc2026/Wc2026Dashboard';
import { attachBaselineComparison } from '@/lib/wc2026/compare';
import {
  getLiveTournamentSnapshot,
  getPreTournamentBaseline,
} from '@/lib/wc2026/live-data';
import { runMonteCarlo } from '@/lib/wc2026/simulate';

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-wc-bebas',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-wc-inter',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-wc-mono',
});

type Wc2026RouteProps = {
  searchParams: Promise<{ us?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function Wc2026Route({ searchParams }: Wc2026RouteProps) {
  const headersList = await headers();
  const country = headersList.get('x-vercel-ip-country');
  const params = await searchParams;

  const isAmerican = country === 'US' || params.us === 'true';
  const snapshot = await getLiveTournamentSnapshot();
  const liveResult = runMonteCarlo(undefined, undefined, 'serious', snapshot);

  let result = liveResult;
  if (liveResult.mode === 'live') {
    try {
      const baseline = await getPreTournamentBaseline();
      result = attachBaselineComparison(liveResult, baseline);
    } catch (error) {
      console.error('[wc2026] Failed to load pre-tournament baseline:', error);
    }
  }

  const fontClassName = `${bebas.variable} ${inter.variable} ${ibmPlexMono.variable}`;

  const content = (
    <Wc2026Dashboard
      initialResult={result}
      snapshot={snapshot}
      fontClassName={fontClassName}
    />
  );

  if (isAmerican) {
    return (
      <MetricQuizModal variant="meme">{content}</MetricQuizModal>
    );
  }

  return content;
}

export const metadata = {
  title: 'WC2026 Title Odds | It\'s Called Football',
  description:
    'Live Monte Carlo simulation of every nation\'s chance to win the 2026 FIFA World Cup — serious model by default, Linguistic Justice mode optional.',
};
