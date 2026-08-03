import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useState } from 'react';

import { db } from '@/db/client';
import { getMeta, setMeta } from '@/db/meta';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type Language } from '@/i18n/translations';

export type ThemePreference = 'system' | 'light' | 'dark';

const LANGUAGE_KEY = 'language';
const THEME_KEY = 'theme_preference';

interface PreferencesValue {
  language: Language;
  setLanguage: (language: Language) => void;
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
  /** Esquema efetivo já resolvido (preferência ou sistema). */
  colorScheme: 'light' | 'dark';
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

function initialLanguage(): Language {
  const stored = getMeta(db, LANGUAGE_KEY);
  if (stored === 'pt' || stored === 'en') return stored;
  return getLocales()[0]?.languageCode === 'pt' ? 'pt' : 'en';
}

function initialTheme(): ThemePreference {
  const stored = getMeta(db, THEME_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [language, setLang] = useState<Language>(initialLanguage);
  const [themePreference, setTheme] = useState<ThemePreference>(initialTheme);

  const colorScheme: 'light' | 'dark' =
    themePreference === 'system' ? (system === 'dark' ? 'dark' : 'light') : themePreference;

  const setLanguage = useCallback((next: Language) => {
    setLang(next);
    setMeta(db, LANGUAGE_KEY, next);
  }, []);

  const setThemePreference = useCallback((next: ThemePreference) => {
    setTheme(next);
    setMeta(db, THEME_KEY, next);
  }, []);

  return (
    <PreferencesContext.Provider
      value={{ language, setLanguage, themePreference, setThemePreference, colorScheme }}>
      {children}
    </PreferencesContext.Provider>
  );
}

/**
 * Preferências do app. Fora do provider (ex.: UI de carregamento das
 * migrations), cai num padrão baseado no sistema.
 */
export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  const system = useColorScheme();
  if (ctx) return ctx;
  return {
    language: 'en',
    setLanguage: () => {},
    themePreference: 'system',
    setThemePreference: () => {},
    colorScheme: system === 'dark' ? 'dark' : 'light',
  };
}
