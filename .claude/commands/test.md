# Rodar testes do projeto

Execute os testes disponíveis e apresente um resumo claro dos resultados.

## Passos

1. **Testes unitários do agente** — rode dentro de `agente/`:
   ```
   cd agente && npm test -- --forceExit 2>&1
   ```
   Mostre: quantos passaram, quantos falharam, e o nome de cada teste que falhou com o motivo.

2. **Type check do Next.js** — rode na raiz:
   ```
   npx tsc --noEmit 2>&1
   ```
   Mostre: se passou limpo ou liste os erros encontrados.

3. **Resumo final** no formato:

   | Suite | Status | Resultado |
   |---|---|---|
   | Agente (unit) | ✅ / ❌ | X passou, Y falhou |
   | TypeScript | ✅ / ❌ | Limpo / N erros |

   Se houver falhas, explique o que precisa ser corrigido e pergunte ao usuário se deseja corrigir agora.

## Observações
- Não rode os testes E2E (`test:e2e`) automaticamente — eles exigem ambiente com servidor rodando e credenciais. Apenas mencione que existem e como rodar manualmente: `npm run test:e2e`.
- Não faça alterações no código sem o usuário pedir.
