import { usePreferences } from '@/preferences/preferences';

import { translate } from './translations';

/** Retorna `t(key, params?)` no idioma atual. */
export function useTranslation() {
  const { language } = usePreferences();
  return {
    t: (key: string, params?: Record<string, string | number>) => translate(language, key, params),
    language,
  };
}
