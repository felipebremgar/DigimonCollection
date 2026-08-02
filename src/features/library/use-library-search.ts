import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { db } from '@/db/client';

import { searchLibraryItems, type LibraryItem } from './queries';

/**
 * Busca full-text na biblioteca (FTS5). Habilitada só com o banco pronto e
 * texto não vazio; mantém os resultados anteriores enquanto digita.
 */
export function useLibrarySearch(query: string, enabled: boolean) {
  const trimmed = query.trim();
  return useQuery<LibraryItem[]>({
    queryKey: ['library-search', trimmed],
    queryFn: () => searchLibraryItems(db, trimmed),
    enabled: enabled && trimmed.length > 0,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
}
