# Digimon Collection

Aplicativo mobile (Android + iOS) de biblioteca de cartas do **Digimon Card Game**:
biblioteca navegável, busca, filtros, deck builder e coleção pessoal. Dados do
[digimoncard.app](https://digimoncard.app/collection), 100% offline após o primeiro sync.

Feito com **React Native + Expo** (SDK 57) e Expo Router. **v1.0 (Beta).**

## Funcionalidades

- **Biblioteca** — grade virtualizada (FlashList) com ~8.500 impressões, lazy load de imagens (`expo-image`).
- **Busca** — full-text instantânea (SQLite FTS5) sobre nome, efeito, herança, keyword e type.
- **Filtros** — combináveis (cor, categoria, raridade, level, custos, forma, attribute, versão, coleção, type, keyword) + ordenação e presets salvos.
- **Detalhe da carta** — arte em alta, efeitos com keywords destacadas, todos os atributos e troca entre artes.
- **Deck builder** — múltiplos decks (main 50 + Digi-Egg 0–5), regras de cópia (`copy_limit`), validação e estatísticas (curva de custo, cores, level/categoria/type), exportar/importar por texto.
- **Coleção** — marcar cartas possuídas, wishlist e "o que falta" para completar um deck.
- **Offline & i18n** — uso pleno offline com sync incremental que preserva decks/coleção; PT/EN; tema claro/escuro.

## Requisitos

- Node.js 20+ (testado em v24)
- App **Expo Go** no celular, ou um emulador Android / simulador iOS

## Começando

```bash
npm install
npm start
```

Depois leia o QR code com o Expo Go, ou rode `npm run android` / `npm run ios`.

## Scripts

| Script | O que faz |
|---|---|
| `npm start` | Inicia o Metro / Expo dev server |
| `npm run android` / `ios` / `web` | Abre na plataforma |
| `npm run lint` | ESLint (`eslint-config-expo`) |
| `npm run format` | Prettier sobre `src/**` |
| `npm run db:generate` | Gera migration a partir de `schema.ts` |
| `npm run db:studio` | Drizzle Studio |

## Arquitetura

Camada de dados relacional local (**SQLite + Drizzle ORM**) com o dataset do
digimoncard.app normalizado em `card` ↔ `printing`. Tudo é lido do SQLite
(offline); o TanStack Query orquestra o sync por ETag preservando os dados do usuário.

```
src/
  app/         # rotas (Expo Router): (tabs) Biblioteca/Decks/Ajustes, card/[..], deck/[..]
  api/         # fetch + normalização do dataset (TanStack Query)
  db/          # schema, migrations, persistência (sync), FTS
  features/    # library, deck-builder, collection, onboarding
  components/  # UI compartilhada, error boundary
  i18n/        # traduções PT/EN
  preferences/ # idioma + tema (persistidos)
  lib/         # telemetria
```

## Testes

A lógica de dados (normalização, persistência, queries, regras de deck, coleção,
sync) é validada com `better-sqlite3` (mesmo driver síncrono do `expo-sqlite`)
sobre o dataset real — incluindo um teste de aceitação end-to-end.

## Build & distribuição (EAS)

Perfis em [`eas.json`](eas.json): `development`, `preview` (APK interno), `production` (TestFlight / Play Internal).

```bash
npx eas-cli login      # autenticar
npx eas-cli init       # vincula o projeto (gera o projectId)
npx eas-cli build --profile preview --platform android
```

Crash reporting/telemetria: abstração em `src/lib/telemetry.ts` (console por
padrão; conecte Sentry via `setTelemetryHandler` no boot).

## Documentação do projeto

- [`plano-implementacao-digimon-tcg.md`](plano-implementacao-digimon-tcg.md) — plano completo, modelagem de dados e regras de negócio.
- [`checklist-marcos-digimon-tcg.html`](checklist-marcos-digimon-tcg.html) — checklist de marcos por versão.
