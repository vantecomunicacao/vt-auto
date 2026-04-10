-- Teste da função generate_vehicle_slug (migração 026)
-- Execute no SQL Editor do Supabase dashboard
-- Todos os blocos devem retornar PASSED

DO $$
DECLARE
  result TEXT;
  expected TEXT;

  PROCEDURE assert_slug(label TEXT, got TEXT, want TEXT) AS
  BEGIN
    IF got = want THEN
      RAISE NOTICE 'PASSED: % → "%"', label, got;
    ELSE
      RAISE WARNING 'FAILED: % → got "%" expected "%"', label, got, want;
    END IF;
  END;

  -- Simula a expressão do trigger com LOWER antes do REGEXP_REPLACE
  FUNCTION slug_expr(brand TEXT, model TEXT, year_model INT, color TEXT)
  RETURNS TEXT AS
  BEGIN
    RETURN TRIM(BOTH '-' FROM
      REGEXP_REPLACE(
        LOWER(UNACCENT(brand || '-' || model || '-' || year_model::TEXT || '-' || COALESCE(color, ''))),
        '[^a-z0-9]+', '-', 'g'
      )
    );
  END;

BEGIN
  -- Caso 1: bug original — "Ford" gerava "ord", agora deve gerar "ford"
  CALL assert_slug(
    'Ford Fiesta 2020 Preto',
    slug_expr('Ford', 'Fiesta', 2020, 'Preto'),
    'ford-fiesta-2020-preto'
  );

  -- Caso 2: marca com acento
  CALL assert_slug(
    'Citroën C3 2022 Branco',
    slug_expr('Citroën', 'C3', 2022, 'Branco'),
    'citroen-c3-2022-branco'
  );

  -- Caso 3: modelo com espaço e maiúscula
  CALL assert_slug(
    'Volkswagen Polo GTS 2023 Cinza',
    slug_expr('Volkswagen', 'Polo GTS', 2023, 'Cinza'),
    'volkswagen-polo-gts-2023-cinza'
  );

  -- Caso 4: cor nula (COALESCE → string vazia, trim remove '-' final)
  CALL assert_slug(
    'Toyota Corolla 2021 (sem cor)',
    slug_expr('Toyota', 'Corolla', 2021, NULL),
    'toyota-corolla-2021'
  );

  -- Caso 5: caracteres especiais no modelo
  CALL assert_slug(
    'BMW X1 sDrive20i 2022 Prata',
    slug_expr('BMW', 'X1 sDrive20i', 2022, 'Prata'),
    'bmw-x1-sdrive20i-2022-prata'
  );

  -- Caso 6: cor com acento
  CALL assert_slug(
    'Fiat Argo 2023 Azul Céu',
    slug_expr('Fiat', 'Argo', 2023, 'Azul Céu'),
    'fiat-argo-2023-azul-ceu'
  );

END $$;
