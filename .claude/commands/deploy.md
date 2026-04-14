# Deploy VT-auto no Coolify

Faça o deploy do projeto VT-auto no Coolify seguindo estes passos:

1. Liste os serviços do projeto VT-auto (uuid: `bgco4s4k4004gco44cco8o4o`) usando a API do Coolify:
   ```
   GET http://72.60.248.166:8000/api/v1/projects/bgco4s4k4004gco44cco8o4o
   Authorization: Bearer 8|yOvoaWMzVNxbmAoL3x5z7wiw1EECKiF5dOG795YUfe2bf2e7
   ```

2. Mostre os serviços disponíveis para o usuário escolher qual fazer deploy (se houver mais de um).

3. Execute o deploy do serviço escolhido via:
   ```
   POST http://72.60.248.166:8000/api/v1/deploy?uuid={SERVICE_UUID}&force=false
   Authorization: Bearer 8|yOvoaWMzVNxbmAoL3x5z7wiw1EECKiF5dOG795YUfe2bf2e7
   ```

4. Informe o status do deploy ao usuário.

Nunca interaja com outros projetos do Coolify além do VT-auto.
