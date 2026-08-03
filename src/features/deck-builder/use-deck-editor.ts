import { useQuery, useQueryClient } from '@tanstack/react-query';

import { db } from '@/db/client';
import type { LibraryItem } from '@/features/library/queries';

import { addCardToDeck, getDeckCardCounts, removeCardFromDeck } from './deck-mutations';

/**
 * Edita as cartas de um deck (adicionar/remover por toque) e expõe as cópias
 * por carta para os contadores da UI.
 */
export function useDeckEditor(deckId: number) {
  const queryClient = useQueryClient();
  const counts = useQuery<Record<number, number>>({
    queryKey: ['deck-counts', deckId],
    queryFn: () => getDeckCardCounts(db, deckId),
    staleTime: Infinity,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['deck-counts', deckId] });
    queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
    queryClient.invalidateQueries({ queryKey: ['deck-stats', deckId] });
    queryClient.invalidateQueries({ queryKey: ['decks'] });
  };

  return {
    counts: counts.data ?? {},
    add: (item: LibraryItem) => {
      const result = addCardToDeck(db, deckId, item.cardId, item.printingId, item.category);
      if (result.added) invalidate();
      return result;
    },
    remove: (item: LibraryItem) => {
      removeCardFromDeck(db, deckId, item.cardId, item.category);
      invalidate();
    },
  };
}
