import { asc, eq } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { card, printing } from '@/db/schema';

/** Uma entrada da biblioteca: uma impressão (arte) com dados da carta base. */
export interface LibraryItem {
  printingId: number;
  cardId: number;
  number: string;
  name: string;
  artUrl: string;
  rarity: string;
  version: string;
  isAltArt: boolean;
  category: string;
}

/**
 * Lista a biblioteca inteira: uma linha por `printing` (a biblioteca expõe
 * impressões, não cartas de regra), ordenada por numeração e com a arte Normal
 * antes das alternativas. O driver é síncrono → `.all()`.
 */
export function getLibraryItems(db: Database): LibraryItem[] {
  return db
    .select({
      printingId: printing.id,
      cardId: card.id,
      number: card.number,
      name: card.name,
      artUrl: printing.artUrl,
      rarity: printing.rarity,
      version: printing.version,
      isAltArt: printing.isAltArt,
      category: card.category,
    })
    .from(printing)
    .innerJoin(card, eq(printing.cardId, card.id))
    .orderBy(asc(card.number), asc(printing.isAltArt), asc(printing.id))
    .all();
}
