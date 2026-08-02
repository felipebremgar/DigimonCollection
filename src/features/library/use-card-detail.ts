import { useQuery } from '@tanstack/react-query';

import { db } from '@/db/client';

import { getCardDetail, type CardDetail } from './card-detail-queries';

/** Carrega o detalhe da carta dona de uma impressão (Etapa 6). */
export function useCardDetail(printingId: number) {
  return useQuery<CardDetail | null>({
    queryKey: ['card-detail', printingId],
    queryFn: () => getCardDetail(db, printingId),
    staleTime: Infinity,
  });
}
