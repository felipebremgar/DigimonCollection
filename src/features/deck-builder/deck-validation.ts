import { EGG_DECK_MAX, MAIN_DECK_SIZE } from './deck-queries';
import type { DeckContents } from './use-deck';

export interface DeckIssue {
  key: string;
  params?: Record<string, string | number>;
}

export interface DeckValidation {
  valid: boolean;
  issues: DeckIssue[];
}

/**
 * Valida um deck (Etapa 13): main == 50, Digi-Egg 0..5, Digi-Egg só no egg
 * deck (e nada além disso), e cópias dentro do copy_limit. Os problemas são
 * retornados como chaves de tradução (i18n resolve na UI).
 */
export function validateDeck(contents: DeckContents): DeckValidation {
  const issues: DeckIssue[] = [];

  if (contents.mainCount !== MAIN_DECK_SIZE) {
    issues.push({
      key: 'validation.mainSize',
      params: { size: MAIN_DECK_SIZE, count: contents.mainCount },
    });
  }
  if (contents.eggCount > EGG_DECK_MAX) {
    issues.push({
      key: 'validation.eggMax',
      params: { max: EGG_DECK_MAX, count: contents.eggCount },
    });
  }

  for (const c of contents.main) {
    if (c.category === 'Digi-Egg') {
      issues.push({ key: 'validation.eggInMain', params: { name: c.name } });
    }
  }
  for (const c of contents.egg) {
    if (c.category !== 'Digi-Egg') {
      issues.push({ key: 'validation.nonEggInEgg', params: { name: c.name } });
    }
  }

  for (const c of [...contents.main, ...contents.egg]) {
    if (c.quantity > c.copyLimit) {
      issues.push({
        key: 'validation.copyLimit',
        params: { name: c.name, qty: c.quantity, limit: c.copyLimit },
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
