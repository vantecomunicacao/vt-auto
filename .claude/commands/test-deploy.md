# Teste, push e deploy do CarGrow

Roda os testes, faz commit/push das alterações locais e dispara o deploy no Coolify.

## Passos

### 1. Rodar testes
Execute na ordem:

a) **Testes unitários do agente**:
   ```
   cd agente && npm test -- --forceExit 2>&1
   ```

b) **Type check do Next.js** (na raiz):
   ```
   npx tsc --noEmit 2>&1
   ```

Apresente um resumo:

| Suite | Status | Resultado |
|---|---|---|
| Agente (unit) | ✅ / ❌ | X passou, Y falhou |
| TypeScript | ✅ / ❌ | Limpo / N erros |

**Se algum teste falhar, PARE aqui.** Mostre o que falhou e pergunte ao usuário se quer corrigir antes de prosseguir. Não faça commit nem deploy.

### 2. Commit + push
Se os testes passaram:

a) Mostre `git status` e `git diff` (resumido) pro usuário ver o que vai ser commitado.

b) Pergunte qual mensagem de commit usar (ou sugira uma com base nas mudanças, seguindo o padrão dos commits recentes — `git log --oneline -5`).

c) Faça o commit (sem `--no-verify`, sem `git add -A` cego — adicione arquivos por nome) e pushe pra `origin/master`.

### 3. Deploy no Coolify
Use o MCP do Coolify (`mcp__coolify__deploy`) para o projeto **CarGrow** (uuid: `bgco4s4k4004gco44cco8o4o`).

**Apps em produção:**
- **CarGrow-App** (uuid: `hos8go8o0go84cs0go0sgggw`) — frontend e admin
- **CarGrow-Agent** (uuid: `cgo880kwco04wwc4scso4c8o`) — backend/IA/webhook

Deploy só do que foi alterado:
- Mudanças em `agente/` → deploy só de **CarGrow-Agent**
- Mudanças em `app/`, `lib/`, `components/`, `hooks/`, raiz (`next.config.ts`, `sentry.*.config.ts`, etc) → deploy só de **CarGrow-App**
- Mudanças nas duas áreas → deploy das **duas apps**

Use `force=false` (deploy normal, com cache).

### 4. Confirmação final
Mostre o(s) UUID(s) do(s) deployment(s) iniciado(s) e o link do Coolify pra acompanhar:
`http://72.60.248.166:8000/project/bgco4s4k4004gco44cco8o4o`

## Observações
- **Nunca** interaja com outros projetos do Coolify além do CarGrow.
- Não rode `test:e2e` automaticamente — exigem servidor rodando.
- Se não houver mudanças locais (working tree limpo), pule o commit/push e vá direto pro deploy, perguntando ao usuário se realmente quer redeployar o que já está no GitHub.
