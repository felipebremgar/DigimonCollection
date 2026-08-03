import { useQuery } from '@tanstack/react-query';

import { db } from '@/db/client';

import { getDeckMissing, type MissingCard } from './collection-queries';

/** Cartas que faltam para completar um deck, dada a coleção do usuário. */
export function useDeckMissing(deckId: number, enabled: boolean) {
  return useQuery<MissingCard[]>({
    queryKey: ['deck-missing', deckId],
    queryFn: () => getDeckMissing(db, deckId),
    enabled,
    staleTime: Infinity,
  });
}
