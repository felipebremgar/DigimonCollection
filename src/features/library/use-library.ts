import { useQuery } from '@tanstack/react-query';

import { db } from '@/db/client';

import { getLibraryItems, type LibraryItem } from './queries';

export const LIBRARY_QUERY_KEY = ['library'] as const;

/**
 * Lê a biblioteca do SQLite local. Deve rodar depois que o sync já populou o
 * banco (`enabled`), para não retornar uma lista vazia antes da hora.
 */
export function useLibrary(enabled: boolean) {
  return useQuery<LibraryItem[]>({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: () => getLibraryItems(db),
    enabled,
    staleTime: Infinity, // muda só quando o dataset é re-sincronizado
  });
}
