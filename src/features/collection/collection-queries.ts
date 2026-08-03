import { eq, sql } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { card, collection, deckCard } from '@/db/schema';

export interface PrintingCollection {
  quantity: number;
  wishlist: boolean;
}

export function getPrintingCollection(db: Database, printingId: number): PrintingCollection {
  const row = db.select().from(collection).where(eq(collection.printingId, printingId)).get();
  return { quantity: row?.quantity ?? 0, wishlist: row?.wishlist ?? false };
}

/** Define quantas cópias desta arte o usuário possui (0 = não possui). */
export function setOwnedQuantity(db: Database, printingId: number, quantity: number): void {
  const q = Math.max(0, quantity);
  db.insert(collection)
    .values({ printingId, quantity: q })
    .onConflictDoUpdate({ target: collection.printingId, set: { quantity: q } })
    .run();
}

/** Alterna a wishlist desta arte e retorna o novo estado. */
export function toggleWishlist(db: Database, printingId: number): boolean {
  const next = !getPrintingCollection(db, printingId).wishlist;
  db.insert(collection)
    .values({ printingId, wishlist: next })
    .onConflictDoUpdate({ target: collection.printingId, set: { wishlist: next } })
    .run();
  return next;
}

export interface MissingCard {
  cardId: number;
  number: string;
  name: string;
  artUrl: string;
  required: number;
  owned: number;
  missing: number;
}

/**
 * O que falta para completar um deck: por carta (agregado por card_id),
 * compara as cópias exigidas com as possuídas (somadas sobre as impressões).
 * Retorna só as cartas com falta.
 */
export function getDeckMissing(db: Database, deckId: number): MissingCard[] {
  const rows = db
    .select({
      cardId: card.id,
      number: card.number,
      name: card.name,
      artUrl: sql<string>`(SELECT p.art_url FROM printing p WHERE p.card_id = ${card.id} AND p.is_alt_art = 0 LIMIT 1)`,
      required: sql<number>`SUM(${deckCard.quantity})`,
      owned: sql<number>`COALESCE((SELECT SUM(col.quantity) FROM collection col JOIN printing p ON p.id = col.printing_id WHERE p.card_id = ${card.id}), 0)`,
    })
    .from(deckCard)
    .innerJoin(card, eq(card.id, deckCard.cardId))
    .where(eq(deckCard.deckId, deckId))
    .groupBy(card.id)
    .orderBy(card.number)
    .all();

  return rows
    .filter((r) => r.required > r.owned)
    .map((r) => ({ ...r, missing: r.required - r.owned }));
}
