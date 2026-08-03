/**
 * Cores do tema, respeitando a preferência do usuário (sistema/claro/escuro).
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { usePreferences } from '@/preferences/preferences';

export function useTheme() {
  const { colorScheme } = usePreferences();
  return Colors[colorScheme];
}
