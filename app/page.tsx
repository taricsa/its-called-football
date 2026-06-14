import { headers } from 'next/headers';
import { themeFlag } from '@/flags';
import MetricQuizModal from '@/components/blocker/MetricQuizModal';
import CourtTheme from '@/components/court/CourtTheme';
import MemeTheme from '@/components/meme/MemeTheme';

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
    return <MemeTheme />;
  };

  if (isAmerican) {
    return (
      <MetricQuizModal variant={variant}>{renderMainContent()}</MetricQuizModal>
    );
  }

  return renderMainContent();
}
