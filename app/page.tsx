import { themeVariantFlag } from '@/flags';

export default async function Home() {
  const variant = await themeVariantFlag();

  return (
    <div>
      {variant === 'court'
        ? 'Court of Justice theme active'
        : 'Meme theme active'}
    </div>
  );
}
