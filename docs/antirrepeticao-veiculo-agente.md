# Antirrepetição da ficha do veículo no Agente — Handoff

Commit: `98d7c8a` · Migration: `036_leads_presented_vehicles.sql`

## 1. Problema

O agente repetia a ficha completa do veículo (marca, modelo, ano, cor, km, opcionais, preço) a cada turno. O caso clássico: o agente apresentava o carro e perguntava a forma de pagamento; o cliente respondia algo curto como "Trocar" ou "Financiar"; e o agente **reapresentava a ficha inteira** antes de seguir para a próxima pergunta.

### Causa raiz (confirmada por logs)

Não havia instrução pedindo para repetir — era comportamento emergente do modelo:

1. Ao receber a resposta de qualificação, o modelo chamava `buscar_veiculos` **de novo** (mesmo já tendo apresentado o carro), por "instinto" de ter os dados frescos.
2. O `searchVehicles` devolvia a ficha completa como `tool result`, fresca no contexto.
3. O modelo é treinado a **usar** o que tools retornam, então parafraseava a ficha na resposta.

A instrução negativa que já existia no prompt ("se já apresentou, não repita") perdia a disputa contra o sinal positivo de ter os dados no contexto — falha mesmo com gpt-4.1.

## 2. Solução — defesa em 3 camadas

A chave: deixar o estado "já apresentado" **explícito** em vez de confiar que o modelo infira isso do histórico.

| Camada | O que faz | Pega o quê |
|---|---|---|
| Estado no banco (`leads.presented_vehicles`) | Registra os veículos cuja ficha já foi enviada | Fonte da verdade |
| Sinal no `leadContext` (prompt) | Declara como fato presente: "JÁ APRESENTADOS: …, não repita" | Maioria dos casos |
| Guard no loop de tool calls | Se o modelo insistir em buscar um carro já apresentado, devolve um **stub** em vez da ficha | Quando o modelo ignora o prompt |

Regra de negócio: **só reapresenta a ficha se for outro veículo** (chave `marca-modelo`). Não há reset por tempo — `presented_vehicles` persiste. Perguntas diretas sobre uma característica continuam respondidas (o stub instrui a responder só aquela característica em uma linha).

## 3. Arquivos

### Novo
- `supabase/migrations/036_leads_presented_vehicles.sql` — coluna `presented_vehicles JSONB NOT NULL DEFAULT '{}'`

### Modificado
- `agente/src/agent.ts`:
  - Selects do lead (3 lugares) passam a trazer `presented_vehicles`
  - `leadContext` ganha a linha de "Veículos JÁ APRESENTADOS" quando há algum
  - Loop de `buscar_veiculos`: guard que devolve stub + persiste a 1ª apresentação
  - Bloco "REGRA ANTIRREPETIÇÃO CRÍTICA" no system prompt (complementar)
- `agente/src/__tests__/processMessage.test.ts` — 3 testes novos

## 4. Estrutura de `presented_vehicles`

```json
{
  "volkswagen-t-cross": "2026-05-20T22:30:36.000Z",
  "toyota-corolla": "2026-05-20T22:35:00.000Z"
}
```

Chave: `marca-modelo` em lowercase, espaços → hífen (`${marca}-${modelo}`.toLowerCase().replace(/\s+/g, '-')).
Valor: timestamp ISO da 1ª apresentação. Só é gravado quando a busca tem **marca E modelo** definidos — buscas amplas (por preço/faixa) não marcam nada.

## 5. Testes

`agente/src/__tests__/processMessage.test.ts` → describe "presented_vehicles (antirrepetição)":
- **1ª apresentação**: `searchVehicles` roda e persiste o veículo
- **2ª apresentação (mesmo carro)**: `searchVehicles` NÃO roda, loga `vehicle_search_skipped`
- **veículo diferente**: `searchVehicles` roda mesmo com outro já apresentado

Suíte completa: 97 testes passando.

## 6. Como diagnosticar em produção

Logs em `agent_logs` (Supabase), por `phone`/`session_id`:
- `vehicle_search` → busca real aconteceu (1ª apresentação do veículo)
- `vehicle_search_skipped` → guard bloqueou a reapresentação (com `key` e `presented_at` no `data`)

Se o agente ainda repetir mesmo com `vehicle_search_skipped` no turno, a repetição veio do modelo copiando a ficha do **histórico da conversa** (`agent_conversations`), não de uma tool call — nesse caso reforçar o prompt.

## 7. Limitações conhecidas

1. **Match exato de marca+modelo.** Se o modelo buscar `T-Cross` numa vez e `T-Cross Highline` noutra, viram chaves diferentes e poderia reapresentar. Risco baixo.
2. **Chave "crua" no prompt.** O sinal lista `volkswagen-t-cross` em vez de `Volkswagen T-Cross`. Cosmético; o LLM entende.
3. **Registro depende de `buscar_veiculos`.** Se o agente apresentar um carro sem chamar a função, não marca. Na prática o prompt obriga a chamar para ter preço/km/opcionais.
