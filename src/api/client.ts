import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient compartilhado. O dataset de cartas muda pouco (poucas releases
 * por ano), então usamos tempos de cache longos; a persistência offline real
 * vem na Etapa 4 (gravação no SQLite).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24h
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 dias
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
