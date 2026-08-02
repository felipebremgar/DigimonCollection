import { and, eq } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { card, deck, deckCard, type DeckZone } from '@/db/schema';

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

export interface AddResult {
  /** false = bloqueado pelo limite de cópias (copy_limit). */
  added: boolean;
  /** limite de cópias da carta (0 banida, 1 limitada, 4 padrão...). */
  limit: number;
  /** cópias da carta no deck após a operação. */
  count: number;
}

/**
 * Adiciona uma cópia da carta ao deck, respeitando o `copy_limit` (Etapa 12).
 * As cópias são agregadas por carta (uma linha por card+zona), então artes
 * diferentes da mesma numeração somam na mesma contagem. A zona vem da
 * categoria. Retorna se adicionou e a contagem/limite para feedback na UI.
 */
export function addCardToDeck(
  db: Database,
  deckId: number,
  cardId: number,
  printingId: number | null,
  category: string,
): AddResult {
  const zone = zoneForCategory(category);
  const existing = findRow(db, deckId, cardId, zone);
  const current = existing?.quantity ?? 0;

  const cardRow = db
    .select({ copyLimit: card.copyLimit })
    .from(card)
    .where(eq(card.id, cardId))
    .get();
  const limit = cardRow?.copyLimit ?? 4;

  if (current >= limit) {
    return { added: false, limit, count: current };
  }

  if (existing) {
    db.update(deckCard)
      .set({ quantity: current + 1 })
      .where(eq(deckCard.id, existing.id))
      .run();
  } else {
    db.insert(deckCard).values({ deckId, cardId, printingId, zone, quantity: 1 }).run();
  }
  bumpDeck(db, deckId);
  return { added: true, limit, count: current + 1 };
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
