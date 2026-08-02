-- Índice full-text (FTS5) sobre os campos textuais da carta (Etapa 7).
-- keywords/types são agregados (texto concatenado) preenchidos na gravação.
-- card_id fica UNINDEXED (só para mapear de volta à carta).
-- remove_diacritics=2 → busca sem acento.
CREATE VIRTUAL TABLE `card_fts` USING fts5(
  name,
  attribute,
  form,
  effect,
  inherited_effect,
  security_effect,
  keywords,
  types,
  card_id UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 2'
);
