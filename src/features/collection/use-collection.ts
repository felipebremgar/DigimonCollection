import { useQuery, useQueryClient } from '@tanstack/react-query';

import { db } from '@/db/client';

import {
  getPrintingCollection,
  setOwnedQuantity,
  toggleWishlist,
  type PrintingCollection,
} from './collection-queries';

/** Estado de coleção de uma impressão (possuídas + wishlist) + mutações. */
export function usePrintingCollection(printingId: number) {
  const queryClient = useQueryClient();
  const query = useQuery<PrintingCollection>({
    queryKey: ['collection', printingId],
    queryFn: () => getPrintingCollection(db, printingId),
    staleTime: Infinity,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['collection', printingId] });
    // Possuídas mudaram → o "o que falta" de qualquer deck pode mudar.
    queryClient.invalidateQueries({ queryKey: ['deck-missing'] });
  };

  return {
    quantity: query.data?.quantity ?? 0,
    wishlist: query.data?.wishlist ?? false,
    setOwned: (quantity: number) => {
      setOwnedQuantity(db, printingId, quantity);
      invalidate();
    },
    toggleWishlist: () => {
      toggleWishlist(db, printingId);
      invalidate();
    },
  };
}
