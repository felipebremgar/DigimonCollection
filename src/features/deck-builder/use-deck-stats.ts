import { useQuery } from '@tanstack/react-query';

import { db } from '@/db/client';

import { computeDeckStats, type DeckStats } from './deck-stats';

/** Estatísticas do deck (curva de custo, cores, level/categoria/type). */
export function useDeckStats(id: number, enabled: boolean) {
  return useQuery<DeckStats>({
    queryKey: ['deck-stats', id],
    queryFn: () => computeDeckStats(db, id),
    enabled,
    staleTime: Infinity,
  });
}
