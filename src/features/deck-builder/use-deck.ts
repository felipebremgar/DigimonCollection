import { useQuery } from '@tanstack/react-query';

import { db } from '@/db/client';

import { getDeck, getDeckCards, type DeckCardItem } from './deck-queries';
import type { Deck } from '@/db/schema';

export interface DeckContents {
  deck: Deck;
  main: DeckCardItem[];
  egg: DeckCardItem[];
  mainCount: number;
  eggCount: number;
}

/** Carrega um deck e suas cartas, separadas por zona (main / egg). */
export function useDeck(id: number) {
  return useQuery<DeckContents | null>({
    queryKey: ['deck', id],
    queryFn: () => {
      const deck = getDeck(db, id);
      if (!deck) return null;
      const cards = getDeckCards(db, id);
      const main = cards.filter((c) => c.zone === 'main');
      const egg = cards.filter((c) => c.zone === 'egg');
      const sum = (list: DeckCardItem[]) => list.reduce((total, c) => total + c.quantity, 0);
      return { deck, main, egg, mainCount: sum(main), eggCount: sum(egg) };
    },
    staleTime: Infinity,
  });
}
