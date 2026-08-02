import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Representação Drizzle da tabela virtual FTS5 `card_fts` (Etapa 7).
 *
 * Fica FORA de `schema.ts` de propósito: o drizzle-kit não sabe gerar tabelas
 * virtuais, então a estrutura vive na migration custom `0002_card_fts.sql` e
 * aqui só declaramos as colunas para o Drizzle montar insert/select.
 */
export const cardFts = sqliteTable('card_fts', {
  name: text('name'),
  attribute: text('attribute'),
  form: text('form'),
  effect: text('effect'),
  inheritedEffect: text('inherited_effect'),
  securityEffect: text('security_effect'),
  keywords: text('keywords'),
  types: text('types'),
  cardId: integer('card_id'),
});

/**
 * Converte o texto digitado numa query FTS5 segura, com prefixo por token
 * (busca instantânea enquanto digita). Ex.: "grey war" → `grey* war*`.
 */
export function toFtsQuery(input: string): string {
  const tokens = input
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}]+/gu, ''))
    .filter((token) => token.length > 0);
  if (tokens.length === 0) return '';
  return tokens.map((token) => `${token}*`).join(' ');
}
