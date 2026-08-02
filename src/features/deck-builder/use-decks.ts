import { useQuery, useQueryClient } from '@tanstack/react-query';

import { db } from '@/db/client';

import { createDeck, deleteDeck, listDecks, renameDeck, type DeckSummary } from './deck-queries';

/** Lista de decks + mutações (criar, renomear, excluir). */
export function useDecks(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery<DeckSummary[]>({
    queryKey: ['decks'],
    queryFn: () => listDecks(db),
    enabled,
    staleTime: Infinity,
  });

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ['decks'] });

  return {
    decks: query.data ?? [],
    isPending: query.isPending,
    create: (name: string) => {
      const id = createDeck(db, name);
      invalidateList();
      return id;
    },
    rename: (id: number, name: string) => {
      renameDeck(db, id, name);
      invalidateList();
      queryClient.invalidateQueries({ queryKey: ['deck', id] });
    },
    remove: (id: number) => {
      deleteDeck(db, id);
      invalidateList();
    },
  };
}
