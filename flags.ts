import { flag } from 'flags/next';
import type { ThemeVariant } from '@/types/theme';

export const themeVariantFlag = flag<ThemeVariant>({
  key: 'theme-variant',
  description: 'A/B test: Court of Justice vs Meme theme layout',
  options: ['court', 'meme'],
  decide() {
    return Math.random() < 0.5 ? 'court' : 'meme';
  },
});
