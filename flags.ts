import { flag } from 'flags/next';
import type { ThemeVariant } from '@/types/theme';

export const themeFlag = flag<ThemeVariant>({
  key: 'theme-variant',
  options: [
    { value: 'court', label: 'Court of Justice Theme' },
    { value: 'meme', label: 'Meme Chaos Theme' },
  ],
  decide() {
    return Math.random() > 0.5 ? 'court' : 'meme';
  },
});
