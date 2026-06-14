import { headers } from 'next/headers';
import { themeFlag } from '@/flags';

type HomeProps = {
  searchParams: Promise<{ us?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const headersList = await headers();
  const country = headersList.get('x-vercel-ip-country');
  const params = await searchParams;

  const isAmerican = country === 'US' || params.us === 'true';
  const variant = await themeFlag();

  if (isAmerican) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="max-w-md rounded-lg border border-red-300 bg-red-50 p-6 text-center text-red-900">
          Access to sign the petition is strictly blocked until you pass a
          metric literacy test.
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center text-zinc-900">
        {variant === 'court'
          ? 'Court of Justice theme active'
          : 'Meme theme active'}
      </div>
    </div>
  );
}
