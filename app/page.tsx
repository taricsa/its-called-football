import { headers } from 'next/headers';
import { themeFlag } from '@/flags';
import MetricQuizModal from '@/components/blocker/MetricQuizModal';
import CourtTheme from '@/components/court/CourtTheme';

type HomeProps = {
  searchParams: Promise<{ us?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const headersList = await headers();
  const country = headersList.get('x-vercel-ip-country');
  const params = await searchParams;

  const isAmerican = country === 'US' || params.us === 'true';
  const variant = await themeFlag();

  const renderMainContent = () => {
    if (variant === 'court') {
      return <CourtTheme />;
    }

    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-950 p-8 text-white">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center font-bold">
          ⚡ Meme Theme Active (Under Construction)
        </div>
      </div>
    );
  };

  if (isAmerican) {
    return (
      <MetricQuizModal variant={variant}>{renderMainContent()}</MetricQuizModal>
    );
  }

  return renderMainContent();
}
