'use client'

import { useState } from 'react'
import {
  Bot, Smartphone, Zap, Brain, MessageSquare, Clock, Bell,
  BookOpen, RotateCcw, ChevronDown, ChevronRight, Users, Eye,
  Settings, Mic, Image, CheckCircle2,
} from 'lucide-react'

interface SectionProps {
  icon: React.ElementType
  title: string
  color: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ icon: Icon, title, color, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="flex-1 text-sm font-semibold text-slate-900">{title}</span>
        {open ? <ChevronDown size={15} className="text-muted-foreground" /> : <ChevronRight size={15} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-border space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

function Step({ number, title, description }: { number: number; title: string; description: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
        {number}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>
      </div>
    </div>
  )
}

function Tag({ label, color = 'blue' }: { label: string; color?: 'blue' | 'green' | 'orange' | 'purple' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${colors[color]}`}>
      {label}
    </span>
  )
}

function ConfigItem({ name, description, example }: { name: string; description: string; example?: string }) {
  return (
    <div className="py-2 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-800">{name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          {example && <p className="text-xs text-slate-500 mt-0.5 italic">Ex: {example}</p>}
        </div>
      </div>
    </div>
  )
}

export function DocsContent() {
  return (
    <div className="max-w-2xl space-y-3">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Agente de IA — Como funciona</p>
            <p className="text-xs text-slate-500">Documentação completa do sistema de atendimento automático</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          O Agente de IA é um assistente de vendas que responde automaticamente clientes no WhatsApp,
          consulta o estoque em tempo real, qualifica leads e envia follow-ups. Tudo isso sem intervenção humana.
        </p>
      </div>

      {/* Fluxo completo */}
      <Section icon={Zap} title="Fluxo completo de uma mensagem" color="#2563EB" defaultOpen>
        <p className="text-xs text-muted-foreground mb-3">
          Do momento que o cliente envia a mensagem até a resposta chegar no WhatsApp dele.
        </p>
        <div className="space-y-3">
          <Step number={1} title="Mensagem chega pelo WhatsApp"
            description="A Evolution API recebe a mensagem e envia ao nosso servidor via webhook. Áudios e imagens também são capturados aqui." />
          <Step number={2} title="Deduplicação e acúmulo (debounce)"
            description={<>O sistema ignora mensagens duplicadas. Se o cliente enviar várias mensagens em sequência, o agente aguarda o <strong>delay de acúmulo</strong> (padrão: 3 segundos) antes de responder, juntando tudo em uma só entrada.</>} />
          <Step number={3} title="Verificações de segurança"
            description="O agente verifica: (1) se está dentro do horário de atendimento configurado, (2) se a IA está ativa para este lead, (3) se há cooldown ativo após mensagem de atendente humano." />
          <Step number={4} title="Busca/cria o lead"
            description="O agente localiza o lead pelo número de telefone. Se for o primeiro contato, cria automaticamente com status ativo." />
          <Step number={5} title="Carrega histórico da conversa"
            description={<>Busca as últimas <strong>N mensagens</strong> anteriores (configurável como &quot;janela de contexto&quot;) para o modelo ter memória da conversa.</>} />
          <Step number={6} title="Classificação RAG"
            description="Antes de buscar a base de conhecimento, o agente usa IA para decidir se a mensagem precisa consultar documentos internos (políticas, garantias, financiamento). Se não precisar, pula esta etapa para economizar tempo." />
          <Step number={7} title="Consulta base de conhecimento (RAG)"
            description="Se necessário, converte a pergunta em vetor (embedding) e busca os trechos mais relevantes da base de conhecimento, com similaridade mínima de 78%." />
          <Step number={8} title="Monta contexto do estoque"
            description="Carrega um resumo de todos os veículos disponíveis no estoque (marca, modelo, ano, preço) para o modelo saber o que existe." />
          <Step number={9} title="Chamada ao OpenAI com ferramentas"
            description={<>Envia para o modelo o system prompt, o histórico, a pergunta do cliente e o estoque. O modelo pode chamar ferramentas: <Tag label="buscar_veiculos" /> para detalhes de um carro específico e <Tag label="registrar_qualificacao" color="green" /> para salvar dados do lead.</>} />
          <Step number={10} title="Processamento de marcadores especiais"
            description={<>A resposta pode conter marcadores invisíveis: <Tag label="[FOTOS:Marca:Modelo]" color="orange" /> para enviar fotos, <Tag label="[TRANSBORDO_ATIVADO]" color="purple" /> para passar para humano e <Tag label="[CONVERSA_ENCERRADA]" color="purple" /> para encerrar o atendimento.</>} />
          <Step number={11} title="Envio humanizado da resposta"
            description="A resposta é quebrada em partes menores. Para cada parte, o agente ativa o indicador de digitação, aguarda um tempo proporcional ao tamanho do texto (simulando velocidade humana) e então envia a mensagem." />
          <Step number={12} title="Envio de fotos (se aplicável)"
            description="Se o modelo marcou [FOTOS:Marca:Modelo], o agente busca as fotos do veículo no banco e as envia sequencialmente com 500ms de intervalo entre cada." />
        </div>
      </Section>

      {/* Tipos de mídia */}
      <Section icon={Mic} title="Áudio e Imagem" color="#7C3AED">
        <div className="space-y-3">
          <div className="flex gap-3">
            <Mic size={15} className="text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800">Áudios (mensagens de voz)</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                O agente baixa o arquivo de áudio, envia para o <strong>Whisper</strong> (modelo de transcrição da OpenAI)
                e converte o áudio em texto. O texto transcrito é então processado como uma mensagem normal.
              </p>
              <p className="text-xs text-slate-500 mt-1 italic">Modelo usado: whisper-1</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Image size={15} className="text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800">Imagens</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                O agente baixa a imagem, envia para o <strong>GPT-4o Vision</strong> junto com a instrução configurada
                em &quot;Instrução para imagens recebidas&quot;. A resposta textual gerada é processada como mensagem normal.
              </p>
              <p className="text-xs text-slate-500 mt-1 italic">Modelo usado: gpt-4o (vision)</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Qualificação de leads */}
      <Section icon={Users} title="Qualificação automática de leads" color="#059669">
        <p className="text-xs text-muted-foreground mb-3">
          Durante a conversa, o modelo detecta automaticamente dados importantes e salva no cadastro do lead.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Veículo de interesse', desc: 'Ex: "quero um HB20 2023"' },
            { label: 'Orçamento', desc: 'Ex: "tenho até R$ 50.000"' },
            { label: 'Forma de pagamento', desc: 'Ex: "quero financiar"' },
            { label: 'Veículo para troca', desc: 'Ex: "tenho um Gol 2019"' },
          ].map(item => (
            <div key={item.label} className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-800">{item.label}</p>
              <p className="text-xs text-green-600 mt-0.5 italic">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Esses dados ficam visíveis no cadastro do lead e são usados pelo agente nas mensagens seguintes
          para personalizar o atendimento.
        </p>
      </Section>

      {/* Transbordo e encerramento */}
      <Section icon={CheckCircle2} title="Transbordo para humano e encerramento" color="#DC2626">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Tag label="Transbordo" color="orange" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quando o cliente pede para falar com uma pessoa, o agente responde normalmente e inclui
              o marcador <code className="bg-muted px-1 py-0.5 rounded text-[11px]">[TRANSBORDO_ATIVADO]</code> na resposta.
              O sistema então: (1) desativa a IA para este lead, (2) muda status para &quot;Em atendimento&quot; e
              (3) envia notificação no WhatsApp para o número configurado informando que o cliente aguarda um humano.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Tag label="Encerramento" color="green" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quando a condição de encerramento é detectada (configurável em &quot;O atendimento termina quando...&quot;),
              o agente inclui o marcador <code className="bg-muted px-1 py-0.5 rounded text-[11px]">[CONVERSA_ENCERRADA]</code>.
              O sistema então: (1) opcional — pausa a IA para este lead, (2) muda status para &quot;Qualificado&quot; e
              (3) envia notificação com um <strong>resumo inteligente da conversa</strong> gerado pela IA, incluindo
              veículo de interesse, intenção de compra, forma de pagamento e orçamento.
            </p>
          </div>
        </div>
      </Section>

      {/* Follow-up */}
      <Section icon={RotateCcw} title="Follow-up automático" color="#D97706">
        <p className="text-xs text-muted-foreground mb-3">
          O servidor roda um ciclo de follow-up a cada 5 minutos verificando leads que pararam de responder.
        </p>
        <div className="space-y-2 mb-3">
          <Step number={1} title="Verificação a cada 5 minutos"
            description="O servidor verifica todos os leads com IA ativa, que ainda não atingiram o máximo de tentativas e que têm o ciclo de follow-up pendente." />
          <Step number={2} title="Calcula se já passou o tempo"
            description="Para cada etapa configurada, verifica se o tempo desde a última mensagem do cliente é maior que o intervalo da etapa." />
          <Step number={3} title="Gera mensagem personalizada via IA"
            description="Usa o prompt configurado para a etapa + histórico recente da conversa para gerar uma mensagem natural e contextual para aquele lead específico." />
          <Step number={4} title="Envia com digitação humanizada"
            description="Ativa o indicador de digitação, aguarda e envia a mensagem. Salva no histórico da conversa." />
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-medium text-amber-800 mb-1">Regras importantes</p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
            <li>O contador do ciclo zera quando o cliente responder</li>
            <li>O contador global (total de tentativas) nunca zera</li>
            <li>O agente só envia follow-up se o lead já enviou ao menos uma mensagem</li>
            <li>Follow-up só funciona se o agente estiver ativo para a loja</li>
          </ul>
        </div>
      </Section>

      {/* Base de conhecimento */}
      <Section icon={BookOpen} title="Base de conhecimento (RAG)" color="#0891B2">
        <p className="text-xs text-muted-foreground mb-3">
          Sistema de busca semântica que permite ao agente responder perguntas sobre políticas,
          garantias, financiamento e outros documentos internos da loja.
        </p>
        <div className="space-y-2">
          <Step number={1} title="Cadastro de documentos"
            description="Na aba Conhecimento, você adiciona textos como políticas de troca, condições de financiamento, garantias etc. Cada texto é convertido em um vetor semântico (embedding) e salvo no banco." />
          <Step number={2} title="Classificação automática"
            description="Antes de buscar, a IA decide se a mensagem precisa consultar a base (economiza tempo e custo para perguntas simples sobre veículos)." />
          <Step number={3} title="Busca por similaridade"
            description="Quando necessário, a pergunta é convertida em vetor e os documentos mais similares (acima de 78% de similaridade) são recuperados e incluídos no contexto do modelo." />
        </div>
        <p className="text-xs text-muted-foreground mt-2 italic">
          Modelo de embedding: text-embedding-ada-002
        </p>
      </Section>

      {/* Horários */}
      <Section icon={Clock} title="Horários de atendimento" color="#6366F1">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Configure dias e horários para o agente responder. Fora do horário, as mensagens chegam normalmente
          no WhatsApp mas o agente não responde — o cliente não recebe nenhuma mensagem de ausência,
          apenas fica sem resposta até o horário de abertura.
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mt-2">
          <p className="text-xs text-indigo-800">
            Todos os horários são no fuso de Brasília (GMT-3). Se não configurar restrição de horário,
            o agente responde 24 horas por dia, 7 dias por semana.
          </p>
        </div>
      </Section>

      {/* Notificações */}
      <Section icon={Bell} title="Notificações via WhatsApp" color="#DB2777">
        <p className="text-xs text-muted-foreground mb-3">
          Configure um número de celular para receber alertas em dois casos:
        </p>
        <div className="space-y-2">
          <div className="flex gap-2.5">
            <Bell size={13} className="text-pink-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-800">Cliente pediu atendimento humano</p>
              <p className="text-xs text-muted-foreground">Notificação imediata com nome e telefone do cliente.</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <CheckCircle2 size={13} className="text-pink-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-800">Conversa encerrada (lead qualificado)</p>
              <p className="text-xs text-muted-foreground">
                Notificação com resumo completo: veículo de interesse, intenção de compra (quente/morno/frio),
                forma de pagamento, orçamento e resumo da conversa em 2-3 frases.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* WhatsApp */}
      <Section icon={Smartphone} title="Conexão WhatsApp" color="#16A34A">
        <p className="text-xs text-muted-foreground leading-relaxed">
          O agente usa a <strong>Evolution API</strong> para se conectar ao WhatsApp. O processo é simples:
        </p>
        <div className="space-y-2 mt-3">
          <Step number={1} title="Gerar QR Code"
            description="Na aba WhatsApp, clique em conectar. Um QR Code é gerado e uma instância é criada na Evolution API." />
          <Step number={2} title="Escanear com o celular"
            description="Abra o WhatsApp no celular do número da loja, vá em Dispositivos conectados e escaneie o QR Code." />
          <Step number={3} title="Conexão estabelecida"
            description="Após escanear, o número fica vinculado. Todas as mensagens recebidas neste número são processadas pelo agente." />
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
          <p className="text-xs text-green-800">
            Se a conexão cair (reinicialização do celular, por exemplo), o agente detecta automaticamente
            e desativa o atendimento. Basta reconectar pelo painel.
          </p>
        </div>
      </Section>

      {/* Configurações */}
      <Section icon={Settings} title="Configurações disponíveis" color="#475569">
        <div className="space-y-0">
          <ConfigItem name="Nome do agente" description="Como o agente se identifica nas conversas." example="AutoAgente, Sofia, Carlos" />
          <ConfigItem name="Tom de voz" description="Estilo de escrita do agente: Profissional, Amigável ou Casual." />
          <ConfigItem name="Instruções do agente" description="Prompt base com regras de comportamento: o que pode responder, como abordar clientes, limites da conversa." />
          <ConfigItem name="Instrução para imagens" description="O que o agente deve fazer quando receber uma foto do cliente." example="Identifique se é um veículo e diga que podemos ajudar." />
          <ConfigItem name="Condição de encerramento" description="Quando a conversa deve ser encerrada e a notificação de qualificação disparada." example="Quando o cliente confirmar visita ou fechar negócio." />
          <ConfigItem name="API Key OpenAI" description="Chave de acesso à OpenAI. Obtenha em platform.openai.com → API keys." />
          <ConfigItem name="Modelo OpenAI" description="GPT-4o Mini: rápido e econômico. GPT-4o: mais inteligente e capaz." />
          <ConfigItem name="Janela de contexto" description="Quantas mensagens anteriores o agente lê para ter memória. Mais mensagens = mais custo." example="15 mensagens (padrão)" />
          <ConfigItem name="Delay de acúmulo (debounce)" description="Tempo que o agente aguarda mensagens em sequência antes de responder. Evita responder a cada frase enviada." example="3 segundos (padrão)" />
          <ConfigItem name="Tamanho por mensagem" description="Máximo de caracteres por mensagem. Respostas longas são quebradas em partes para parecer mais humano." example="300 caracteres (médio)" />
          <ConfigItem name="Velocidade de digitação" description="Tempo por caractere antes de enviar. Simula a velocidade humana de digitação." example="20ms/caractere = ~60 chars/seg" />
          <ConfigItem name="Cooldown após mensagem humana" description="Período de silêncio do bot após um atendente enviar uma mensagem. Evita que o bot interfira no atendimento humano." example="30 minutos (padrão)" />
          <ConfigItem name="Número para notificação" description="Celular que recebe alertas de transbordo e encerramento. Formato: DDI + DDD + número." example="5511999990000" />
        </div>
      </Section>

      {/* Onde a IA é usada */}
      <Section icon={Brain} title="Onde a IA é usada" color="#7C3AED">
        <p className="text-xs text-muted-foreground mb-3">
          O sistema faz múltiplas chamadas à OpenAI em uma única mensagem:
        </p>
        <div className="space-y-2">
          {[
            { step: 'Transcrição de áudio', model: 'Whisper-1', desc: 'Converte áudios enviados pelo cliente em texto' },
            { step: 'Análise de imagem', model: 'GPT-4o Vision', desc: 'Interpreta fotos enviadas pelo cliente' },
            { step: 'Classificação RAG', model: 'GPT-4o Mini', desc: 'Decide se precisa buscar na base de conhecimento' },
            { step: 'Embedding de busca', model: 'text-embedding-ada-002', desc: 'Converte pergunta em vetor para busca semântica' },
            { step: 'Resposta principal', model: 'GPT-4o Mini / GPT-4o', desc: 'Gera a resposta com acesso ao estoque e ferramentas' },
            { step: 'Resumo de encerramento', model: 'GPT-4o Mini / GPT-4o', desc: 'Gera resumo da conversa ao encerrar o atendimento' },
            { step: 'Mensagem de follow-up', model: 'GPT-4o Mini / GPT-4o', desc: 'Gera mensagem personalizada de reengajamento' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium text-slate-800">{item.step}</p>
                  <Tag label={item.model} color="purple" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Logs */}
      <Section icon={Eye} title="Logs e monitoramento" color="#0F766E">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cada atendimento gera registros detalhados de cada etapa: recebimento do webhook,
          carregamento do histórico, busca RAG, chamada à OpenAI (com tokens usados), envio das mensagens,
          fotos enviadas, transbordo e encerramento.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Acesse <strong>Logs do Agente</strong> no menu lateral para acompanhar em tempo real
          o que está acontecendo em cada conversa, incluindo erros e falhas.
        </p>
      </Section>

    </div>
  )
}
