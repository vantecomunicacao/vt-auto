# Deploy CarGrow no Coolify

Faça o deploy do projeto **CarGrow-prod** no Coolify seguindo estes passos:

1. Liste os apps do projeto **CarGrow-prod** (uuid: `yqebjlxld70s5dzaxpexot2p`) usando o MCP do Coolify (`mcp__coolify__list_applications`).

2. Mostre os apps disponíveis para o usuário escolher qual fazer deploy:
   - **CarGrow-App** (uuid: `slfhqipyz3q5klx3qzv4hjdy`) — frontend Next.js + admin
   - **CarGrow-Agent** (uuid: `wea9tc3yq5zhsrschv03m3zw`) — backend/IA/webhook

3. Execute o deploy do app escolhido via `mcp__coolify__deploy` (use `force=false` para deploy normal com cache).

4. Informe o status do deploy ao usuário e mostre o link para acompanhar:
   `http://2.24.91.39:8000/project/yqebjlxld70s5dzaxpexot2p`

Nunca interaja com outros projetos do Coolify além do CarGrow-prod.
