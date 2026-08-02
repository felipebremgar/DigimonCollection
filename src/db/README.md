# `db/` — Persistência local (Etapa 2)

Camada de dados relacional local com **Drizzle ORM + `expo-sqlite`**.

Conterá:

- `schema.ts` — tabelas `card`, `printing`, os três N:N (`color`, `keyword`, `type`),
  `link_detail`, `deck`, `deck_card`.
- `client.ts` — instância do banco SQLite.
- `migrations/` — migrations versionadas geradas pelo `drizzle-kit`.

Busca textual via **SQLite FTS5** (Etapa 7). Ver a modelagem completa em
`plano-implementacao-digimon-tcg.md`.
