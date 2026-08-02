import { asc, eq, sql } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { cardFts, toFtsQuery } from '@/db/fts';
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
const libraryColumns = {
  printingId: printing.id,
  cardId: card.id,
  number: card.number,
  name: card.name,
  artUrl: printing.artUrl,
  rarity: printing.rarity,
  version: printing.version,
  isAltArt: printing.isAltArt,
  category: card.category,
};

export function getLibraryItems(db: Database): LibraryItem[] {
  return db
    .select(libraryColumns)
    .from(printing)
    .innerJoin(card, eq(printing.cardId, card.id))
    .orderBy(asc(card.number), asc(printing.isAltArt), asc(printing.id))
    .all();
}

/**
 * Busca full-text (FTS5) sobre nome, atributo, forma, efeito, herança,
 * keyword e type. Retorna as impressões das cartas que casam, na mesma ordem
 * da biblioteca. Query vazia → lista vazia.
 */
export function searchLibraryItems(db: Database, queryText: string): LibraryItem[] {
  const match = toFtsQuery(queryText);
  if (match === '') return [];
  return db
    .select(libraryColumns)
    .from(printing)
    .innerJoin(card, eq(printing.cardId, card.id))
    .innerJoin(cardFts, eq(cardFts.cardId, card.id))
    .where(sql`${cardFts} MATCH ${match}`)
    .orderBy(asc(card.number), asc(printing.isAltArt), asc(printing.id))
    .all();
}
