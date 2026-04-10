-- Corrige a função de geração de slug de veículos
-- Bug: LOWER era aplicado depois do REGEXP_REPLACE, então letras maiúsculas
-- (ex: 'F' de 'Ford') eram tratadas como inválidas e viram '-', depois cortadas
-- pelo TRIM. Resultado: "Ford" gerava "ord" em vez de "ford".
-- Fix: LOWER agora é aplicado antes do REGEXP_REPLACE.

CREATE OR REPLACE FUNCTION generate_vehicle_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Gera o slug base: marca-modelo-ano-cor (tudo minúsculo, sem acento)
  -- LOWER é aplicado ANTES do REGEXP_REPLACE para que letras maiúsculas
  -- não sejam confundidas com caracteres inválidos.
  base_slug := TRIM(BOTH '-' FROM
    REGEXP_REPLACE(
      LOWER(UNACCENT(NEW.brand || '-' || NEW.model || '-' || NEW.year_model::TEXT || '-' || COALESCE(NEW.color, ''))),
      '[^a-z0-9]+', '-', 'g'
    )
  );

  final_slug := base_slug;

  -- Garante unicidade dentro da loja
  WHILE EXISTS (
    SELECT 1 FROM public.vehicles
    WHERE store_id = NEW.store_id AND slug = final_slug AND id != NEW.id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-gera slugs de todos os veículos existentes para corrigir os afetados
-- Faz UPDATE disparando o trigger (atualiza brand para forçar o recálculo)
UPDATE public.vehicles SET brand = brand;
