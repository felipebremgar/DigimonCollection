import { useQuery } from '@tanstack/react-query';

import { fetchCardDataset } from './digimoncard';
import { normalizeDataset, type NormalizedDataset } from './normalize';

export const CARD_DATASET_QUERY_KEY = ['card-dataset'] as const;

/**
 * Baixa e normaliza o dataset completo de cartas do digimoncard.app.
 *
 * A gravação no SQLite local (uso offline) é feita na Etapa 4; aqui apenas
 * buscamos e normalizamos, com o cache do TanStack Query evitando refetch.
 */
export function useCardDataset() {
  return useQuery<NormalizedDataset>({
    queryKey: CARD_DATASET_QUERY_KEY,
    queryFn: async ({ signal }) => normalizeDataset((await fetchCardDataset(signal)).cards),
  });
}
