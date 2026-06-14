'use client';

import { useState } from 'react';
import type { ThemeVariant } from '@/types/theme';

export default function Home() {
  const [variant] = useState<ThemeVariant>('court');

  return (
    <div>
      {variant === 'court'
        ? 'Court of Justice theme active'
        : 'Meme theme active'}
    </div>
  );
}
