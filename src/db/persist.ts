import { eq } from 'drizzle-orm';

import type { NormalizedDataset } from '@/api/normalize';

import type { Database } from './client';
import { cardFts } from './fts';
import { DATASET_VERSION_KEY } from './meta';
import {
  card,
  cardColor,
  cardKeyword,
  cardTypeLink,
  collection,
  color,
  deckCard,
  keyword,
  linkDetail,
  meta,
  printing,
  type,
  type ColorName,
  type DeckZone,
} from './schema';

/**
 * Grava o dataset normalizado no SQLite local (sync "puxa tudo").
 *
 * Roda numa transação: limpa os dados anteriores, insere as tabelas de
 * referência (cor/type/keyword) e as cartas com `.returning()` para resolver
 * as chaves naturais em IDs, e então grava printings, N:N, Link e a versão.
 * Idempotente: rodar de novo substitui todo o conteúdo do dataset.
 *
 * **Preserva os dados do usuário (Etapa 16):** decks e coleção são capturados
 * por chave natural (numeração da carta / URL da arte) antes do rebuild e
 * restaurados depois, resolvendo os novos IDs. Referências a cartas/artes que
 * saíram do dataset são descartadas (dataset é a fonte da verdade).
 *
 * É **síncrona** de propósito: o driver `expo-sqlite` do Drizzle é síncrono
 * (`'sync'`), então a transação precisa concluir todo o trabalho antes de
 * retornar — usar `await` aqui fecharia a transação cedo demais.
 */

// Orçamento de variáveis por INSERT. O SQLite do expo-sqlite suporta 32766,
// mas mantemos folga para evitar "too many SQL variables".
const MAX_VARS = 20000;

function chunkByColumns<T>(rows: T[], columns: number): T[][] {
  const size = Math.max(1, Math.floor(MAX_VARS / Math.max(1, columns)));
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
}

export function persistDataset(
  database: Database,
  dataset: NormalizedDataset,
  version: string,
): void {
  database.transaction((tx) => {
    // 0. Captura os dados do usuário por chave natural (antes de apagar).
    const deckSnapshot = tx
      .select({
        deckId: deckCard.deckId,
        cardNumber: card.number,
        printingArt: printing.artUrl,
        zone: deckCard.zone,
        quantity: deckCard.quantity,
      })
      .from(deckCard)
      .innerJoin(card, eq(card.id, deckCard.cardId))
      .leftJoin(printing, eq(printing.id, deckCard.printingId))
      .all();
    const collectionSnapshot = tx
      .select({
        artUrl: printing.artUrl,
        quantity: collection.quantity,
        wishlist: collection.wishlist,
      })
      .from(collection)
      .innerJoin(printing, eq(printing.id, collection.printingId))
      .all();

    // 1. Limpa dados anteriores (ordem segura de FK; refs por último).
    //    O cascade esvazia deck_card e collection — restaurados no fim (passo 9).
    tx.delete(cardColor).run();
    tx.delete(cardKeyword).run();
    tx.delete(cardTypeLink).run();
    tx.delete(linkDetail).run();
    tx.delete(printing).run();
    tx.delete(card).run();
    tx.delete(color).run();
    tx.delete(keyword).run();
    tx.delete(type).run();
    tx.delete(cardFts).run();

    // 2. Tabelas de referência → mapas nome→id.
    const colorMap = new Map<string, number>();
    for (const rows of chunkByColumns(dataset.colors, 1)) {
      const ret = tx
        .insert(color)
        .values(rows.map((name) => ({ name: name as ColorName })))
        .returning({ id: color.id, name: color.name })
        .all();
      ret.forEach((r) => colorMap.set(r.name, r.id));
    }

    const typeMap = new Map<string, number>();
    for (const rows of chunkByColumns(dataset.types, 1)) {
      const ret = tx
        .insert(type)
        .values(rows.map((name) => ({ name })))
        .returning({ id: type.id, name: type.name })
        .all();
      ret.forEach((r) => typeMap.set(r.name, r.id));
    }

    const keywordMap = new Map<string, number>();
    for (const rows of chunkByColumns(dataset.keywords, 1)) {
      const ret = tx
        .insert(keyword)
        .values(rows.map((name) => ({ name })))
        .returning({ id: keyword.id, name: keyword.name })
        .all();
      ret.forEach((r) => keywordMap.set(r.name, r.id));
    }

    // 3. Cartas → mapa número→id.
    const cardMap = new Map<string, number>();
    for (const rows of chunkByColumns(dataset.cards, 17)) {
      const ret = tx.insert(card).values(rows).returning({ id: card.id, number: card.number }).all();
      ret.forEach((r) => cardMap.set(r.number, r.id));
    }

    const cardId = (number: string): number => {
      const id = cardMap.get(number);
      if (id == null) throw new Error(`Carta não encontrada ao gravar: ${number}`);
      return id;
    };

    // 4. Printings.
    const printingRows = dataset.printings.map((p) => ({
      cardId: cardId(p.cardNumber),
      rarity: p.rarity,
      version: p.version,
      isAltArt: p.isAltArt,
      artUrl: p.artUrl,
      illustrator: p.illustrator,
      printingNotes: p.printingNotes,
    }));
    const printingMap = new Map<string, number>(); // artUrl → novo id (p/ restauro)
    for (const rows of chunkByColumns(printingRows, 7)) {
      const ret = tx
        .insert(printing)
        .values(rows)
        .returning({ id: printing.id, artUrl: printing.artUrl })
        .all();
      ret.forEach((r) => printingMap.set(r.artUrl, r.id));
    }

    // 5. N:N.
    const colorLinks = dataset.cardColors.map((x) => ({
      cardId: cardId(x.cardNumber),
      colorId: colorMap.get(x.colorName)!,
    }));
    for (const rows of chunkByColumns(colorLinks, 2)) {
      tx.insert(cardColor).values(rows).run();
    }

    const typeLinks = dataset.cardTypes.map((x) => ({
      cardId: cardId(x.cardNumber),
      typeId: typeMap.get(x.typeName)!,
    }));
    for (const rows of chunkByColumns(typeLinks, 2)) {
      tx.insert(cardTypeLink).values(rows).run();
    }

    const keywordLinks = dataset.cardKeywords.map((x) => ({
      cardId: cardId(x.cardNumber),
      keywordId: keywordMap.get(x.keywordName)!,
    }));
    for (const rows of chunkByColumns(keywordLinks, 2)) {
      tx.insert(cardKeyword).values(rows).run();
    }

    // 6. Link.
    const linkRows = dataset.links.map((l) => ({
      cardId: cardId(l.cardNumber),
      linkCost: l.linkCost,
      linkTargetTypeId: null,
    }));
    for (const rows of chunkByColumns(linkRows, 3)) {
      tx.insert(linkDetail).values(rows).run();
    }

    // 7. Índice full-text (agrega keywords/types por carta).
    const textByCard = (pairs: { cardNumber: string; value: string }[]) => {
      const map = new Map<string, string[]>();
      for (const { cardNumber, value } of pairs) {
        const list = map.get(cardNumber) ?? [];
        list.push(value);
        map.set(cardNumber, list);
      }
      return map;
    };
    const keywordText = textByCard(
      dataset.cardKeywords.map((x) => ({ cardNumber: x.cardNumber, value: x.keywordName })),
    );
    const typeText = textByCard(
      dataset.cardTypes.map((x) => ({ cardNumber: x.cardNumber, value: x.typeName })),
    );
    const ftsRows = dataset.cards.map((c) => ({
      cardId: cardId(c.number),
      name: c.name,
      attribute: c.attribute,
      form: c.form,
      effect: c.effect,
      inheritedEffect: c.inheritedEffect,
      securityEffect: c.securityEffect,
      keywords: (keywordText.get(c.number) ?? []).join(' '),
      types: (typeText.get(c.number) ?? []).join(' '),
    }));
    for (const rows of chunkByColumns(ftsRows, 9)) {
      tx.insert(cardFts).values(rows).run();
    }

    // 9. Restaura os dados do usuário resolvendo os novos IDs; descarta as
    //    referências a cartas/artes que saíram do dataset.
    const restoredCollection: {
      printingId: number;
      quantity: number;
      wishlist: boolean;
    }[] = [];
    for (const c of collectionSnapshot) {
      const printingId = printingMap.get(c.artUrl);
      if (printingId != null) {
        restoredCollection.push({ printingId, quantity: c.quantity, wishlist: c.wishlist });
      }
    }
    for (const rows of chunkByColumns(restoredCollection, 3)) {
      tx.insert(collection).values(rows).run();
    }

    const restoredDeckCards: {
      deckId: number;
      cardId: number;
      printingId: number | null;
      zone: DeckZone;
      quantity: number;
    }[] = [];
    for (const d of deckSnapshot) {
      const resolvedCardId = cardMap.get(d.cardNumber);
      if (resolvedCardId == null) continue;
      const printingId = d.printingArt ? (printingMap.get(d.printingArt) ?? null) : null;
      restoredDeckCards.push({
        deckId: d.deckId,
        cardId: resolvedCardId,
        printingId,
        zone: d.zone,
        quantity: d.quantity,
      });
    }
    for (const rows of chunkByColumns(restoredDeckCards, 5)) {
      tx.insert(deckCard).values(rows).run();
    }

    // 10. Versão do dataset.
    tx.insert(meta)
      .values({ key: DATASET_VERSION_KEY, value: version })
      .onConflictDoUpdate({ target: meta.key, set: { value: version } })
      .run();
  });
}
