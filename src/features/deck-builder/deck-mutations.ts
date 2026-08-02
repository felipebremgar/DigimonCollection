import { and, eq } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { deck, deckCard, type DeckZone } from '@/db/schema';

/** Digi-Egg vai para o egg deck; todo o resto para o main. */
export function zoneForCategory(category: string): DeckZone {
  return category === 'Digi-Egg' ? 'egg' : 'main';
}

function bumpDeck(db: Database, deckId: number): void {
  db.update(deck).set({ updatedAt: new Date() }).where(eq(deck.id, deckId)).run();
}

function findRow(db: Database, deckId: number, cardId: number, zone: DeckZone) {
  return db
    .select({ id: deckCard.id, quantity: deckCard.quantity })
    .from(deckCard)
    .where(and(eq(deckCard.deckId, deckId), eq(deckCard.cardId, cardId), eq(deckCard.zone, zone)))
    .get();
}

/**
 * Adiciona uma cópia da carta ao deck. As cópias são agregadas por carta
 * (uma linha por card+zona), então artes diferentes da mesma numeração somam
 * na mesma contagem. A zona vem da categoria.
 */
export function addCardToDeck(
  db: Database,
  deckId: number,
  cardId: number,
  printingId: number | null,
  category: string,
): void {
  const zone = zoneForCategory(category);
  const existing = findRow(db, deckId, cardId, zone);
  if (existing) {
    db.update(deckCard)
      .set({ quantity: existing.quantity + 1 })
      .where(eq(deckCard.id, existing.id))
      .run();
  } else {
    db.insert(deckCard).values({ deckId, cardId, printingId, zone, quantity: 1 }).run();
  }
  bumpDeck(db, deckId);
}

/** Remove uma cópia da carta (apaga a linha quando chega a zero). */
export function removeCardFromDeck(
  db: Database,
  deckId: number,
  cardId: number,
  category: string,
): void {
  const zone = zoneForCategory(category);
  const existing = findRow(db, deckId, cardId, zone);
  if (!existing) return;
  if (existing.quantity <= 1) {
    db.delete(deckCard).where(eq(deckCard.id, existing.id)).run();
  } else {
    db.update(deckCard)
      .set({ quantity: existing.quantity - 1 })
      .where(eq(deckCard.id, existing.id))
      .run();
  }
  bumpDeck(db, deckId);
}

/** Cópias por carta no deck (agregado por card_id): { [cardId]: quantidade }. */
export function getDeckCardCounts(db: Database, deckId: number): Record<number, number> {
  const rows = db
    .select({ cardId: deckCard.cardId, quantity: deckCard.quantity })
    .from(deckCard)
    .where(eq(deckCard.deckId, deckId))
    .all();
  const counts: Record<number, number> = {};
  for (const row of rows) {
    counts[row.cardId] = (counts[row.cardId] ?? 0) + row.quantity;
  }
  return counts;
}
