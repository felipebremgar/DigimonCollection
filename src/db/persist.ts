import type { NormalizedDataset } from '@/api/normalize';

import type { Database } from './client';
import { DATASET_VERSION_KEY } from './meta';
import {
  card,
  cardColor,
  cardKeyword,
  cardTypeLink,
  color,
  keyword,
  linkDetail,
  meta,
  printing,
  type,
  type ColorName,
} from './schema';

/**
 * Grava o dataset normalizado no SQLite local (sync "puxa tudo" da Etapa 4).
 *
 * Roda numa transação: limpa os dados anteriores, insere as tabelas de
 * referência (cor/type/keyword) e as cartas com `.returning()` para resolver
 * as chaves naturais em IDs, e então grava printings, N:N, Link e a versão.
 * Idempotente: rodar de novo substitui todo o conteúdo.
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
    // 1. Limpa dados anteriores (ordem segura de FK; refs por último).
    tx.delete(cardColor).run();
    tx.delete(cardKeyword).run();
    tx.delete(cardTypeLink).run();
    tx.delete(linkDetail).run();
    tx.delete(printing).run();
    tx.delete(card).run();
    tx.delete(color).run();
    tx.delete(keyword).run();
    tx.delete(type).run();

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
    for (const rows of chunkByColumns(printingRows, 7)) {
      tx.insert(printing).values(rows).run();
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

    // 7. Versão do dataset.
    tx.insert(meta)
      .values({ key: DATASET_VERSION_KEY, value: version })
      .onConflictDoUpdate({ target: meta.key, set: { value: version } })
      .run();
  });
}
