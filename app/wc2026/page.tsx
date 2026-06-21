import { headers } from 'next/headers';
import MetricQuizModal from '@/components/blocker/MetricQuizModal';
import Wc2026Page from '@/components/wc2026/Wc2026Page';
import { themeFlag } from '@/flags';
import { getLiveTournamentSnapshot } from '@/lib/wc2026/live-data';
import { runMonteCarlo } from '@/lib/wc2026/simulate';

type Wc2026RouteProps = {
  searchParams: Promise<{ us?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function Wc2026Route({ searchParams }: Wc2026RouteProps) {
  const headersList = await headers();
  const country = headersList.get('x-vercel-ip-country');
  const params = await searchParams;

  const isAmerican = country === 'US' || params.us === 'true';
  const variant = await themeFlag();
  const snapshot = await getLiveTournamentSnapshot();
  const result = runMonteCarlo(undefined, undefined, snapshot);

  const content = <Wc2026Page result={result} variant={variant} />;

  if (isAmerican) {
    return <MetricQuizModal variant={variant}>{content}</MetricQuizModal>;
  }

  return content;
}

export const metadata = {
  title: 'WC2026 Win Probabilities | It\'s Called Football',
  description:
    'Live Monte Carlo simulation of every nation\'s chance to win the 2026 FIFA World Cup — updated after every match.',
};
