# `db/` — Persistência local (Etapa 2 ✅)

Camada de dados relacional local com **Drizzle ORM + `expo-sqlite`**.

## Arquivos

- `schema.ts` — tabelas, enums, `relations` e tipos inferidos.
- `client.ts` — abre o SQLite (`digimon.db`), liga `PRAGMA foreign_keys`
  e exporta a instância `db` do Drizzle.
- `provider.tsx` — `DatabaseProvider`, aplica as migrations no boot
  (via `useMigrations`) antes de renderizar o app.
- `migrations/` — migrations versionadas geradas pelo `drizzle-kit`
  (`0000_*.sql`, `meta/` e `migrations.js` para o runtime Expo).

## Modelo

`card` (carta de regras, 1 por numeração) 1:N `printing` (impressão/arte).
Três N:N sobre `card`: `color`/`card_color`, `keyword`/`card_keyword`,
`type`/`card_type_link`. `link_detail` (1:1 opcional) marca cartas com Link.
Decks em `deck` + `deck_card` (aponta para `card`; `printing_id` é cosmético).

Ver a modelagem completa e as regras em `plano-implementacao-digimon-tcg.md`.

## Fluxo de migrations

```bash
npm run db:generate   # gera nova migration a partir de schema.ts
npm run db:studio     # abre o Drizzle Studio (inspeção do schema)
```

As migrations rodam automaticamente no app via `DatabaseProvider`.
Requer `babel.config.js` (plugin `inline-import` para `.sql`) e
`metro.config.js` (`sourceExts` com `sql`) — já configurados na raiz.

## Próximos passos

- Busca textual via **SQLite FTS5** (Etapa 7) — nova migration.
- Tabela `meta` / MMKV para `dataset_version` (Etapa 4).
- Extensão futura de preços (`store`, `price`) ancorada em `printing`.
