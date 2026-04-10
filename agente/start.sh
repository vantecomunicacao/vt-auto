#!/bin/bash
# Inicia ngrok + agente em paralelo

PORT=3001
NGROK_DOMAIN="unzealous-gunner-graphitic.ngrok-free.dev"

echo "🚀 Iniciando agente na porta $PORT..."
echo "🌐 Tunnel: https://$NGROK_DOMAIN"
echo ""

# Verifica se ngrok está instalado
if ! command -v ngrok &> /dev/null; then
  echo "❌ ngrok não encontrado. Instale em: https://ngrok.com/download"
  exit 1
fi

# Mata processos anteriores nessa porta, se houver
lsof -ti:$PORT | xargs kill -9 2>/dev/null

# Inicia ngrok em background
ngrok http $PORT --url=$NGROK_DOMAIN --log=stdout > /tmp/ngrok-agente.log 2>&1 &
NGROK_PID=$!

# Aguarda ngrok subir
sleep 2

echo "✅ ngrok PID: $NGROK_PID"
echo ""

# Inicia o agente (foreground — Ctrl+C para parar tudo)
trap "kill $NGROK_PID 2>/dev/null; echo ''; echo 'Agente encerrado.'" EXIT
npm run dev
