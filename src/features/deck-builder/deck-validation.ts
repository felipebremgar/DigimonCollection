import { EGG_DECK_MAX, MAIN_DECK_SIZE } from './deck-queries';
import type { DeckContents } from './use-deck';

export interface DeckValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Valida um deck (Etapa 13):
 * - deck principal com exatamente 50 cartas;
 * - Digi-Egg deck com 0 a 5 cartas;
 * - Digi-Egg só no egg deck; nada além de Digi-Egg no egg deck;
 * - cópias por carta dentro do copy_limit.
 */
export function validateDeck(contents: DeckContents): DeckValidation {
  const errors: string[] = [];

  if (contents.mainCount !== MAIN_DECK_SIZE) {
    errors.push(
      `O deck principal precisa de exatamente ${MAIN_DECK_SIZE} cartas (tem ${contents.mainCount}).`,
    );
  }
  if (contents.eggCount > EGG_DECK_MAX) {
    errors.push(
      `O Digi-Egg deck permite no máximo ${EGG_DECK_MAX} cartas (tem ${contents.eggCount}).`,
    );
  }

  for (const c of contents.main) {
    if (c.category === 'Digi-Egg') {
      errors.push(`${c.name} é Digi-Egg e não pode ficar no deck principal.`);
    }
  }
  for (const c of contents.egg) {
    if (c.category !== 'Digi-Egg') {
      errors.push(`${c.name} não é Digi-Egg e não pode ficar no Digi-Egg deck.`);
    }
  }

  for (const c of [...contents.main, ...contents.egg]) {
    if (c.quantity > c.copyLimit) {
      errors.push(`${c.name}: ${c.quantity} cópias excedem o limite de ${c.copyLimit}.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
