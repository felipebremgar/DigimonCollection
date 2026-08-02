# `db/` — Persistência local (Etapas 2 e 4 ✅)

Camada de dados relacional local com **Drizzle ORM + `expo-sqlite`**.

## Arquivos

- `schema.ts` — tabelas, enums, `relations` e tipos inferidos (inclui `meta`).
- `client.ts` — abre o SQLite (`digimon.db`), liga `PRAGMA foreign_keys`
  e exporta a instância `db` do Drizzle.
- `provider.tsx` — `DatabaseProvider`, aplica as migrations no boot.
- `meta.ts` — chave-valor `meta` (versão do dataset) e `getCardCount`.
- `persist.ts` — `persistDataset()`: grava o dataset normalizado no SQLite
  (Etapa 4), resolvendo chaves naturais → IDs via `.returning()`.
- `use-dataset-sync.ts` — hook `useDatasetSync()`: sync "puxa tudo" com
  controle de versão (ETag).
- `migrations/` — migrations versionadas (`0000_*`, `0001_*` = tabela `meta`).

## Sync (Etapa 4)

`useDatasetSync()` compara a versão local (`meta.dataset_version`) com o ETag
remoto (HEAD): se o banco está vazio ou a versão mudou, baixa tudo, normaliza
(camada `api/`) e grava com `persistDataset` numa transação. Offline usa o que
já está no banco.

> **Driver síncrono:** o `expo-sqlite` do Drizzle é `'sync'` — `persistDataset`
> e os helpers de `meta` usam os terminais `.run()`/`.get()`/`.all()` (sem
> `await`), senão a transação fecharia antes dos inserts.

## Modelo

`card` (carta de regras, 1 por numeração) 1:N `printing` (impressão/arte).
Três N:N sobre `card`: `color`/`card_color`, `keyword`/`card_keyword`,
`type`/`card_type_link`. `link_detail` (1:1 opcional). Decks em `deck` +
`deck_card`. Ver `plano-implementacao-digimon-tcg.md`.

## Migrations

```bash
npm run db:generate   # gera nova migration a partir de schema.ts
npm run db:studio     # inspeciona o schema
```

Requer `babel.config.js` (inline-import de `.sql`) e `metro.config.js`
(`sourceExts` com `sql`) — já configurados na raiz.

## Próximos passos

- Busca textual via **SQLite FTS5** (Etapa 7).
- Sync incremental / resolução de conflitos (Etapa 16).
