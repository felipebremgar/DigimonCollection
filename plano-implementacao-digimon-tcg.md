# Plano de Implementação — App de Biblioteca Digimon TCG

Aplicativo mobile (Android + iOS) de biblioteca de cartas do Digimon Card Game, com biblioteca navegável, busca, filtros e deck builder. Dados das cartas consumidos da API do [digimoncard.app](https://digimoncard.app/collection).

> **Nota de escopo:** a pesquisa de preços em lojas online fica fora deste plano e será tratada em um momento futuro.

---

## Sumário

- [Stack tecnológica](#stack-tecnológica)
- [Decisão de arquitetura central](#decisão-de-arquitetura-central)
- [Modelagem de dados](#modelagem-de-dados)
- [Extensão futura — preços](#extensão-futura--preços)
- [Plano por blocos de versão](#plano-por-blocos-de-versão)
- [Regras de negócio consolidadas](#regras-de-negócio-consolidadas)

---

## Stack tecnológica

**Framework: React Native + Expo.** O app é *read-heavy* (consome API, guarda local, exibe/filtra listas com imagens, monta decks) sem exigir capacidades nativas pesadas. O gargalo técnico real é performance de scroll em listas grandes com imagens — resolvido no ecossistema RN — e o Expo + EAS Build acelera o caminho até o beta em Android e iOS.

### Estratégia de armazenamento

Dois problemas distintos com soluções distintas: **dados estruturados** vão para um banco relacional local; **imagens nunca entram no banco** — guarda-se a URL e delega-se o arquivo ao cache de disco.

| Camada | Ferramenta | Papel |
|---|---|---|
| Dados relacionais | `expo-sqlite` + Drizzle ORM | cartas, decks, joins, filtros facetados, 100% offline |
| Busca textual | SQLite FTS5 | search instantâneo sobre nome, efeito, herança, keyword, type |
| Imagens | `expo-image` (cache de disco) | galeria de artes, lazy load, placeholder/blurhash |
| Sync de servidor | TanStack Query | fetch + revalidação da API do digimoncard.app |
| Flags leves | MMKV | versão do dataset, preferências do usuário |

**Dados estruturados — SQLite + Drizzle.** O modelo é genuinamente relacional (`card` ↔ `printing`, três N:N, `link_detail`, deck), com queries facetadas que combinam vários filtros. Drizzle dá type-safety em TypeScript, migrations versionadas (para quando a API mudar) e SQL real nos filtros complexos. Key-value (AsyncStorage/MMKV) não serve para as cartas — só para flags leves.

**Imagens — `expo-image`.** Guarda-se apenas `printing.art_url`; o `expo-image` baixa sob demanda, cacheia em memória e disco, mostra placeholder enquanto carrega e descarta da RAM o que sai da tela. Estratégia de download em fases:

- **v1.0 beta → lazy sob demanda:** só baixa a arte quando a carta entra na viewport; o cache de disco torna a segunda exibição instantânea. É o padrão certo para começar.
- **Prefetch seletivo:** ao abrir o detalhe, pré-carregar as artes alternativas da carta via `Image.prefetch()`.
- **Download completo opt-in (pós-beta):** botão "baixar biblioteca para uso offline" que força o cache de todas as URLs.

### Fluxo de sincronização

1. **Primeiro launch:** buscar o dataset da API, normalizar em `card` + `printing` + N:N, gravar no SQLite. As imagens **não** são baixadas aqui — só as URLs.
2. **Uso normal:** todas as queries (biblioteca, filtros, busca, deck) batem no SQLite local (instantâneo, offline). Imagens carregam sob demanda conforme o scroll.
3. **Sync incremental:** guardar `dataset_version` (MMKV ou tabela `meta`); ao abrir o app, checar se a API tem versão nova e atualizar só o delta.

---

## Decisão de arquitetura central

A modelagem separa duas entidades que o site atual confunde:

- **`card`** — a carta de *regras* (uma linha por numeração canônica, ex. `BT21-009`). É contra ela que o limite de cópias do deck é validado.
- **`printing`** — a *impressão/arte* (várias linhas por `card`). É o que a biblioteca e os filtros expõem.

Consequência prática:

- **Cópias no deck** → agregadas por `card`. 2 Gatchmon arte normal + 2 Gatchmon arte alternativa contam como **4 cópias da mesma carta**.
- **Busca e filtros** → operam sobre `printing`. Cada arte alternativa (marcada com `*` ao lado da numeração) é uma entrada distinta na biblioteca.

Atributos de **regra** (nome, cor, level, efeito, type, keyword...) pertencem a `card`. Atributos de **impressão** (raridade, versão, arte, ilustrador da arte) pertencem a `printing`.

---

## Modelagem de dados

### Tabela `card` — carta de regras

| Campo | Tipo | Null | Notas |
|---|---|---|---|
| `id` | PK | NN | interno |
| `number` | TEXT | NN | numeração canônica, ex. `BT21-009` — **UNIQUE** |
| `set_code` | TEXT | NN | coleção, ex. `BT21` |
| `name` | TEXT | NN | |
| `category` | ENUM | NN | Digimon, Tamer, Option, Digi-Egg, Dual |
| `form` | TEXT | NULL | In-Training, Rookie, Champion, Ultimate, Mega... |
| `attribute` | TEXT | NULL | Virus, Vaccine, Data... |
| `level` | TEXT | NULL | `"2"`..`"7"`, `"--"` ou `NULL` |
| `play_cost` | INT | NULL | Digimon / Tamer |
| `digivolution_cost` | INT | NULL | Digimon |
| `use_cost` | INT | NULL | Option / Dual |
| `dp` | INT | NULL | múltiplos de 1000 |
| `effect` | TEXT | NN | texto principal |
| `inherited_effect` | TEXT | NULL | efeito de herança |
| `security_effect` | TEXT | NULL | efeito de segurança |
| `illustrator` | TEXT | NN | ilustrador base |
| `notes` | TEXT | NULL | reprint, notas únicas |
| `copy_limit` | INT | NN | default **4** (0 = banida, 1 = limitada, até 50) |

### Tabela `printing` — impressão / arte

| Campo | Tipo | Null | Notas |
|---|---|---|---|
| `id` | PK | NN | |
| `card_id` | FK → card | NN | |
| `rarity` | ENUM | NN | C, U, R, SR, UR, SEC, P — **pertence à impressão** |
| `version` | ENUM | NN | Normal, Arte Alternativa, Foil, Textured, Pre-Release, Box Topper, Full Art, Stamp, SP, RP |
| `is_alt_art` | BOOL | NN | flag rápida de filtro (deriva do `*`) |
| `art_url` | TEXT | NN | |
| `illustrator` | TEXT | NULL | sobrepõe `card.illustrator` quando a arte difere |
| `printing_notes` | TEXT | NULL | reprint, box topper etc. |

### Atributos multivalorados (N:N sobre `card`)

Os três grupos seguem o mesmo padrão simétrico:

```
color          (id PK, name ENUM UNIQUE)   -- Vermelho, Azul, Amarelo, Verde, Preto, Roxo, Branco
card_color     (card_id FK, color_id FK, PK(card_id, color_id))

keyword        (id PK, name TEXT UNIQUE, explanation TEXT)   -- "<Blocker>": "A Digimon with..."
card_keyword   (card_id FK, keyword_id FK, PK(card_id, keyword_id))

type           (id PK, name TEXT UNIQUE)   -- Search, Hero, Social, Appmon, Glowing Dawn, Titan...
card_type_link (card_id FK, type_id FK, PK(card_id, type_id))
```

> `type`/`card_type_link` são os **Types** do rodapé da carta (ex. Gatchmon é Search *e* Hero). Distinto de `card.category`, que é o que a carta é (mostrado no topo).

### Detalhe de Link

Link **não** é categoria — é um efeito secundário que uma carta Digimon ou Option pode possuir. A presença de uma linha em `link_detail` sinaliza que a carta tem Link:

```
link_detail (card_id PK FK,
             link_cost INT,
             link_target_type_id FK → type NULL)   -- ex. Link [Appmon] trait
```

### Tabelas de deck

```
deck      (id PK, name TEXT, created_at, updated_at)

deck_card (id PK,
           deck_id FK,
           card_id FK,          -- aponta para CARD → cópias contam por regra
           printing_id FK NULL, -- arte escolhida para exibição (cosmético)
           zone ENUM NOT NULL,  -- 'main' | 'egg'
           quantity INT NOT NULL)
```

### Diagrama de relações

```
card ─┬─< card_color      >─ color
      ├─< card_keyword     >─ keyword
      ├─< card_type_link   >─ type
      ├─── link_detail (1:1 opcional) ──> type
      ├─< printing ──< price >── store      (extensão futura — ver abaixo)
      └─< deck_card >── deck
```

---

## Extensão futura — preços

> **Fora do escopo do v1.0 beta.** Esta seção documenta a modelagem de preços para quando a equipe chegar nessa fase. Nenhuma tabela aqui precisa ser criada agora — todas nascem numa migration futura ancorada em `printing`, sem tocar nas tabelas existentes (`card`, `printing`, deck, busca).

O preço é vinculado à **impressão** (`printing`), não à carta base: uma arte alternativa foil vale diferente da normal, então cada `printing` carrega seu próprio preço por loja.

```
store  (id PK,
        name TEXT NOT NULL,
        base_url TEXT,
        currency TEXT)            -- BRL, USD...

price  (id PK,
        store_id    FK → store,
        printing_id FK → printing,
        amount INT NOT NULL,      -- em CENTAVOS (evita erro de float)
        link TEXT,                -- URL do produto na loja
        fetched_at TIMESTAMP)     -- quando o preço foi capturado
```

Duas decisões de robustez embutidas:

- **`amount` em centavos (INT)** — dinheiro em float acumula erro de arredondamento. Guarda-se `1299` para R$ 12,99 e formata-se na exibição.
- **`fetched_at`** — permite identificar preços velhos e decidir quando rebuscar.

**Consulta de preço:** join direto `printing → price → store`, filtrando pela printing e ordenando por `amount`. Como o vínculo é na printing, cada arte carrega seu próprio preço.

**Por que não custa nada adiar:** `printing.id` já existe e é estável. As tabelas `store` e `price` se conectam a ele numa migration futura sem alterar nada do que já existe.

**O trabalho real da fase de preços é o matching:** as lojas identificam produtos por códigos próprios, não pela numeração do TCG. Descobrir qual produto de cada loja corresponde a cada `printing` é o esforço central. Se uma loja expõe um identificador estável para reconsulta, adiciona-se uma coluna `external_id TEXT` em `price` nessa fase — não antes.

**Preparação recomendada no código (barata, sem implementação):** definir um contrato único `PriceProvider` (`search(printing) → Price[]`) que qualquer loja implementa, e reservar um módulo `pricing/` isolado. Isso evita que o código de preço nasça acoplado à primeira loja integrada.

---

## Plano por blocos de versão

### Bloco 0 — Fundação (v0.1 – v0.3)

**Etapa 1 — v0.1: Setup do projeto**
Inicializar projeto React Native + Expo. Configurar repositório, linter, EAS Build, estrutura de pastas e navegação esqueleto (tabs: Biblioteca, Deck Builder).

**Etapa 2 — v0.2: Modelagem de dados**
Implementar o schema `card` ↔ `printing` (1:N) em Drizzle + `expo-sqlite`, com os três multivalorados (cor, keyword, type), `link_detail`, tabelas de deck e migrations versionadas. Base estrutural de todo o resto.

**Etapa 3 — v0.3: Integração com a API do digimoncard.app**
Mapear e testar os endpoints da API de coleção, criar a camada de serviço com TanStack Query e normalizar o retorno para o schema interno, dividindo cada carta em `card` + suas `printing`.

### Bloco 1 — Biblioteca base (v0.4 – v0.6)

**Etapa 4 — v0.4: Cache e persistência local**
Gravar o dataset normalizado no SQLite local para uso offline. Sync inicial "puxa tudo" (só dados, não imagens) com `dataset_version` em MMKV/tabela `meta` para controle de versão.

**Etapa 5 — v0.5: Listagem da biblioteca**
Grid/lista de cartas com FlashList (virtualização) e `expo-image` (lazy load, cache de disco, placeholder). Foco em performance de scroll — o ponto fraco do site atual.

**Etapa 6 — v0.6: Detalhe da carta**
Arte em alta, texto de efeito, keywords destacadas, herança, efeito de segurança e todos os atributos. Suporte a múltiplas artes/versões da mesma numeração.

### Bloco 2 — Busca e filtros (v0.7 – v0.9)

**Etapa 7 — v0.7: Search textual**
Busca full-text via SQLite FTS5 sobre nome, atributo, forma, efeito, herança, keyword e type. Índice local para resposta instantânea.

**Etapa 8 — v0.8: Filtros por atributo**
Filtros combináveis: cor (multi), category, raridade, coleção, versão, level, forma, attribute, type, keyword, custos. Toggle "mostrar todas as artes" vs "uma impressão por carta".

**Etapa 9 — v0.9: Ordenação e presets**
Ordenar por numeração, level, DP, custo, raridade. Salvar filtros favoritos. Otimização de thumbnails vs. full art.

### Bloco 3 — Deck Builder (v0.10 – v0.14)

**Etapa 10 — v0.10: Estrutura do deck**
Modelo de deck: main (exatamente 50) + Digi-Egg (0–5). Persistência local de múltiplos decks.

**Etapa 11 — v0.11: Adicionar/remover cartas**
Tela dividida (biblioteca ↔ deck). Adicionar por toque, contador de cópias por carta, visualização lateral do deck em construção.

**Etapa 12 — v0.12: Regras de cópias**
Contagem agregada por `card_id` (não por `printing_id`). Aplicar `copy_limit`: default 4, banidas (0), limitadas (1), especiais (até 50).

**Etapa 13 — v0.13: Validação de deck**
Validar 50 no main, 0–5 no egg, Digi-Egg restrito ao egg deck (via `category`), respeito aos limites de cópia. Feedback visual de deck válido/inválido.

**Etapa 14 — v0.14: Estatísticas do deck**
Curva de custo, distribuição de cores, contagem por level/category/type. Exportar/importar deck (código ou texto).

### Bloco 4 — Coleção e polimento (v0.15 – v0.18)

**Etapa 15 — v0.15: Perfil e coleção pessoal**
Marcar cartas possuídas, wishlist, cálculo de "o que falta" para completar um deck.

**Etapa 16 — v0.16: Offline e sincronização**
Uso pleno offline (biblioteca + decks), sync incremental do dataset, resolução de conflitos.

**Etapa 17 — v0.17: Performance, acessibilidade e i18n**
Otimização de memória/imagens, dark mode, suporte PT/EN, testes em dispositivos de baixo custo.

**Etapa 18 — v0.18: QA e distribuição**
Telemetria/crash reporting, builds de distribuição (TestFlight / Google Play Internal), onboarding.

### Marco final

**Etapa 19 — v1.0 (Beta):** publicação do beta com biblioteca, busca, filtros e deck builder completos e validados.

---

## Regras de negócio consolidadas

| Requisito | Como é atendido |
|---|---|
| Mesma entidade para cópias, distintas para busca | `card` 1:N `printing`; deck agrega por `card`, biblioteca lista `printing` |
| Deck de exatamente 50 + egg 0–5 | Validação em app sobre `deck_card.zone` |
| Digi-Egg só no egg deck | `card.category = 'Digi-Egg'` |
| Limite de cópias configurável (0/1/4/50) | `card.copy_limit`, soma de `quantity` por `card_id` |
| 5 categorias (Digimon, Tamer, Option, Digi-Egg, Dual) | `card.category` ENUM |
| Link como efeito, não categoria | Presença de linha em `link_detail` |
| Dual sem play_cost, só use_cost | Campos nulos naturais em `card` |
| Múltiplas cores sem limite | `card_color` N:N |
| Múltiplos Types por carta | `card_type_link` N:N |
| 10 versões / 7 raridades | ENUMs em `printing` |
| Level literal (inclui `"--"`) | `card.level` TEXT NULL |
| Keywords com texto explicativo | `keyword.explanation` reutilizável |
| Busca por nome/atributo/forma/efeito/herança/type | Campos em `card` + índice full-text |
