# CarGrow

SaaS multi-tenant para concessionárias: vitrine pública por subdomínio, painel admin, agente IA no WhatsApp com RAG, follow-up automático e distribuição round-robin de leads para vendedores.

## Stack

- **Web:** Next.js 16 (App Router) · React 19 · Tailwind 4 · Supabase (Postgres + Auth + Storage + RLS)
- **Agente:** Express + TypeScript, integrado a Evolution API (Baileys) e OpenAI
- **Infra:** Coolify (deploy), Sentry (erros), `pgvector` para embeddings

## Requisitos

- Node 20+
- Conta Supabase (com `pg_cron`, `pg_net` e `vector` habilitados)
- Instância Evolution API rodando
- Chave OpenAI

## Setup local

1. **Variáveis de ambiente:**
   - `.env.local` na raiz (Next.js) — ver chaves esperadas em [scripts/healthcheck.mts](scripts/healthcheck.mts)
   - `agente/.env` (Express) — `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_WEBHOOK_SECRET`, `ENCRYPTION_KEY`, `AUTH_ENABLED`, `PUBLIC_URL`, `ALLOWED_ORIGINS`

2. **Instalar dependências:**

   ```bash
   npm install
   cd agente && npm install && cd ..
   ```

3. **Migrar banco:**

   ```bash
   npx supabase db push   # aplica migrations em supabase/migrations/
   ```

4. **Rodar:**

   ```bash
   npm run dev                       # web em http://localhost:3000
   cd agente && npm run dev          # agente em http://localhost:3001
   ```

## Subdomínios em dev

O middleware roteia por subdomínio:

- `app.localhost:3000` → painel admin
- `master.localhost:3000` → painel master (super-admin)
- `<slug>.localhost:3000` → storefront público da loja

## Testes

```bash
npm run test:e2e        # Playwright (admin, leads, vehicles, settings, storefront, master)
npm run test:e2e:ui     # modo UI
cd agente && npm test   # Jest (auth middleware, follow-up, processMessage, splitMessage, ...)
```

## Healthcheck

```bash
npm run healthcheck         # local: agente + Supabase + Evolution + decrypt
npm run healthcheck:prod    # exige .env.prod.healthcheck
```

## Documentação

- [AGENTS.md](AGENTS.md) — convenções de UI (padrão `useUnsavedChanges`)
- [ANALISE.md](ANALISE.md) — análise técnica e backlog de melhorias
- [CLAUDE.md](CLAUDE.md) — instruções para o assistente de IA

## Deploy

Coolify aponta para o projeto **CarGrow-prod** (`yqebjlxld70s5dzaxpexot2p`). `npm run build` para web, `npm run build && npm start` no agente.
