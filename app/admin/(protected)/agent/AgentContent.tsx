'use client'

import { useState, useEffect } from 'react'
import { useAutoSave } from '@/hooks/useAutoSave'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Bot, Eye, EyeOff, KeyRound, Smartphone, BookOpen, Clock, Settings, RotateCcw } from 'lucide-react'
import { WhatsAppConnect } from './WhatsAppConnect'
import { KnowledgeEditor } from './KnowledgeEditor'
import { FollowUpConfig } from './FollowUpConfig'
import { AgentHours } from './AgentHours'

interface Props {
  storeId: string
  followUpEnabled: boolean
  followUpConfig: { intervals: number[]; messages: string[] }
  agentHours: Record<string, { enabled: boolean; start: string; end: string }> | null
}


export function AgentContent({ storeId, followUpEnabled, followUpConfig, agentHours }: Props) {
  const [loading, setLoading] = useState(true)
  const [showKey, setShowKey] = useState(false)
  const [msgSizeMode, setMsgSizeMode] = useState<'small' | 'medium' | 'large' | 'custom'>('medium')
  const DEFAULT_PROMPT = `Você é um assistente virtual especializado na venda de carros da **VT Autos Exemplo**
Seu objetivo é pré qualificar o lead que chega com interesse em comprar um veiculo.

## Modo WhatsApp:
Responda sempre como se estivesse conversando no WhatsApp.
Seja leve, prático e direto. Sem parágrafos longos.


# Objetivo
Seu papel é fazer o **pré-atendimento** dos leads que chegam via WhatsApp, fornecendo informações sobre a VT Autos  **qualificando potenciais clientes** antes de transferir para o atendimento humano.
- Evite respostas secas


# Etapas da conversa

## Contexto
- O Lead chega até nós, geralmente através um um anuncio online. Ele pode chegar já perguntando de um veículo específico ou apenas cumprimentando.

## 1. Apresentação
- Se apresente dando boas-vindas e diga que vai fazer algumas perguntas, para então passar para o consultor especialista.
Caso o lead inicie a conversa com uma mensagem clara do carro e modelo que deseja, siga esses passos:
- Cumprimente de forma cordial,  Ex: Olá! Seja bem vindo(a). Segue as informações do veículo: "Envie as informações como nome, modelo, ano, um breve resumo dos principais opcionais, e **Envie todas as fotos desse modelo***
- Inicie a qualificação na etapa 3 **Tipo de negociação** fazendo a pergunta sempre APÓS as fotos.

## 2. Buscar o modelo
- Busque somente os veículos marcados como "disponível" na base de dados.
- Apresente os dados do carro: modelo, ano, ** resuma a descrição**, preço e todas as imagens. Sempre envie as imagens junto da  e faça a pergunta SEMPRE depois das fotos.

- Quando o lead pedir opções de veículos, você precisa ter alguma informação sobre a preferencia, como faixa de preço, preferência de câmbio, marca ou modelo do carro. Use essas informações para filtrar os mais relevantes.
- Nunca liste mais de 4 e mostre apenas o nome e número, ex:
    Temos alguns modelos disponíveis:
    1- Nissan Kicks Exclusive
    2- Fiat Cronos Drive 1.3
    Quer saber mais sobre algum desses modelos?

## 3. Tipo de negociação
- Identifique o tipo de negociação que o lead deseja fazer: **Compra à vista**, **financiamento** ou **troca**.
  - Se for troca: pergunte o modelo e ano do veículo do lead.
  - Se for financiamento: pergunte o valor de parcela ideal. Após a resposta, pergunte qual valor de entrada ele possui.

## 4. Canal de atendimento
- Pergunte se ele prefere continuar por **WhatsApp mesmo** ou receber uma **ligação do consultor**.
- Faça essa pergunta com sutileza, mostrando que nos importamos com o que o lead prefere.

## 5. Agendamento
- Pergunte ao lead se ele gostaria de agendar uma visita a loja.
- Não pergunte o dia ou horário, nem diga que está agendado, apenas se há interesse de conhecer o veículo
- Caso o lead queira agendar com dia e hora marcada, diga que o Consultor vai confirmar o horário e data certinho.

## 6. Finalização do atendimento
- Após tudo respondido, agradeça e diga que consultor entrará em contato.
- Se identificar irritação, transfira imediatamente ao consultor.


# Regras para resposta
- Ao responder perguntas diretas sobre o veículo, seja objetivo: cite só o primeiro nome do carro e responda em 1-2 linhas com um comentário natural. Ex: "O Cruise tem 56 mil km, bem conservado pra o ano." Depois volte à próxima pergunta de qualificação pendente.


# Regras de conversa

- Se o lead demonstrar pouco engajamento, responda e em seguida faça uma pergunta simples para manter a conversa fluindo.
- Quando lead pedir vídeo, diga que o vendedor vai enviar, e volte a pergunta de qualificação
- Receba descrição de imagens normalmente, responda como se tivesse visto a imagem
- Quando o cliente sair do assunto, crie uma frase curta e natural para trazer a conversa de volta à qualificação, mantendo o tom amigável e informal de vendedor. A frase deve ser diferente das anteriores e adaptada ao contexto. Depois da frase, retome de forma sutil a próxima pergunta pendente.
  Exemplos (não copie, apenas se inspire):
  "Aproveitando, me fala..."
  "Agora, só pra gente seguir..."
  "Então, voltando pro carro..."
- Prefira não repetir perguntas com escrita idêntica ao mesmo que o lead, para não parecer um robô.
- Nunca entre em assuntos pessoais nem cite terceiros.
- Quando o modelo de veículo citado não estiver na base, diga:
"Esse modelo não está na nossa base agora, mas nosso consultor pode te ajudar rapidinho! Quer que eu peça pra ele te chamar?"
E, se ele quiser, **transfira imediatamente para um humano**, finalizando o atendimento
- Importante: O agente não deve presumir respostas ou preencher campos com base em suposições. Somente preencha os campos quando o lead responder com clareza.
- Antes de responder, releia o histórico. Nunca repita uma pergunta que já foi feita ou já foi respondida. Avance a conversa, se o cliente já confirmou algo, registre e siga em frente.
- Faça uma pergunta de cada vez. Nunca despeje todas as informações de uma vez.
- Evitar frases de abertura robóticas: "Não comece respostas com 'Claro!', 'Ótimo!', 'Com certeza!', 'Olá!'."`.trim()

  const FORM_DEFAULTS = {
    agent_active: false,
    agent_name: 'AutoAgente',
    agent_tone: 'professional',
    agent_prompt: '',
    openai_api_key: '',
    openai_model: 'gpt-4o-mini',
    agent_context_window: 15,
    agent_debounce_seconds: 3,
    agent_cooldown_minutes: 30,
    agent_rate_limit: 20,
    notification_phone: '',
    agent_max_message_chars: 300,
    agent_typing_speed_ms: 20,
    agent_image_prompt: '',
    agent_end_prompt: '',
    agent_stop_on_end: true,
  }
  const [form, setForm] = useState(FORM_DEFAULTS)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const { store } = await res.json()
          if (store) {
            const chars: number = store.agent_max_message_chars ?? 300
            const mode = chars === 150 ? 'small' : chars === 300 ? 'medium' : chars === 500 ? 'large' : 'custom'
            setMsgSizeMode(mode as 'small' | 'medium' | 'large' | 'custom')
            const loaded = {
              agent_active: store.agent_active ?? false,
              agent_name: store.agent_name ?? 'AutoAgente',
              agent_tone: store.agent_tone ?? 'professional',
              agent_prompt: store.agent_prompt || '',
              openai_api_key: store.openai_api_key || '',
              openai_model: store.openai_model || 'gpt-4o-mini',
              agent_context_window: store.agent_context_window ?? 15,
              agent_debounce_seconds: store.agent_debounce_seconds ?? 3,
              agent_cooldown_minutes: store.agent_cooldown_minutes ?? 30,
              agent_rate_limit: store.agent_rate_limit ?? 20,
              notification_phone: store.notification_phone || '',
              agent_max_message_chars: chars,
              agent_typing_speed_ms: store.agent_typing_speed_ms ?? 20,
              agent_image_prompt: store.agent_image_prompt || '',
              agent_end_prompt: store.agent_end_prompt || '',
              agent_stop_on_end: store.agent_stop_on_end ?? true,
            }
            setForm(loaded)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleResetPrompt() {
    const first = window.confirm('Tem certeza que deseja redefinir o prompt para o modelo padrão?')
    if (!first) return
    const second = window.confirm('Esta ação vai apagar o prompt atual. Confirma?')
    if (!second) return
    setForm(f => ({ ...f, agent_prompt: DEFAULT_PROMPT }))
    toast.info('Prompt redefinido para o modelo padrão. Salve para confirmar.')
  }

  useAutoSave(loading ? null : form, {
    onSave: async (currentForm) => {
      if (!currentForm) return
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentForm),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Erro ao salvar.')
        throw new Error('save failed')
      }
    },
  })

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={20} className="animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-5">

      {/* Toggle principal — sempre visível */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: form.agent_active ? 'var(--ds-primary-50)' : '#F1F5F9' }}>
              <Bot size={20} style={{ color: form.agent_active ? 'var(--ds-primary-600)' : '#94A3B8' }} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Agente de IA</p>
              <p className="text-xs text-muted-foreground">
                {form.agent_active ? 'Respondendo no WhatsApp' : 'Desativado — clientes não recebem respostas automáticas'}
              </p>
            </div>
          </div>
          <Switch
            checked={form.agent_active}
            onCheckedChange={v => setForm(f => ({ ...f, agent_active: v }))}
          />
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="settings" className="gap-1.5 text-xs">
            <Settings size={13} />Personalidade
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5 text-xs">
            <Smartphone size={13} />WhatsApp
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5 text-xs">
            <BookOpen size={13} />Conhecimento
          </TabsTrigger>
          <TabsTrigger value="followup" className="gap-1.5 text-xs">
            <Clock size={13} />Follow-up
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-1.5 text-xs">
            <Clock size={13} />Horários
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Personalidade ─────────────────────────────────────────── */}
        <TabsContent value="settings" className="outline-none space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <p className="text-sm font-medium text-slate-900">Personalidade</p>

            {/* Campos ocultos para enganar o heurístico de login do Chrome */}
            <input type="text" name="fake_user" autoComplete="username" aria-hidden="true" className="hidden" readOnly />
            <input type="password" name="fake_pass" autoComplete="new-password" aria-hidden="true" className="hidden" readOnly />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Nome do agente</Label>
                <Input value={form.agent_name}
                  onChange={e => setForm(f => ({ ...f, agent_name: e.target.value }))}
                  className="h-10" placeholder="AutoAgente" autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Tom de voz</Label>
                <Select value={form.agent_tone} onValueChange={v => setForm(f => ({ ...f, agent_tone: v ?? '' }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="friendly">Amigável</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">Instruções para o agente</Label>
                <button
                  type="button"
                  onClick={handleResetPrompt}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-slate-700 transition-colors"
                >
                  <RotateCcw size={11} />
                  Redefinir prompt
                </button>
              </div>
              <Textarea value={form.agent_prompt}
                onChange={e => setForm(f => ({ ...f, agent_prompt: e.target.value }))}
                placeholder="Você é um assistente de vendas especializado em veículos. Seja direto, responda sobre o estoque disponível e incentive a visita à loja..."
                rows={5} className="resize-none" />
              <p className="text-xs text-muted-foreground">Descreva como o agente deve se comportar, o que pode ou não responder.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Instrução para imagens recebidas</Label>
              <Textarea value={form.agent_image_prompt}
                onChange={e => setForm(f => ({ ...f, agent_image_prompt: e.target.value }))}
                placeholder="O cliente enviou uma imagem. Descreva o que vê e responda de forma útil no contexto de venda de veículos."
                rows={2} className="resize-none" />
              <p className="text-xs text-muted-foreground">Instrução enviada ao agente quando o cliente mandar uma foto. Ex: "Identifique se é um veículo e informe o cliente que podemos ajudá-lo."</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">O atendimento termina quando</Label>
              <Textarea value={form.agent_end_prompt}
                onChange={e => setForm(f => ({ ...f, agent_end_prompt: e.target.value }))}
                placeholder="Ex: o cliente confirmar interesse em visitar a loja, fechar negócio, ou pedir para ser contatado depois."
                rows={2} className="resize-none" />
              <p className="text-xs text-muted-foreground">Descreva a condição de encerramento. Ao detectar, o agente envia notificação com resumo da conversa.</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Pausar agente ao encerrar</p>
                <p className="text-xs text-muted-foreground">Quando a conversa for encerrada, o agente para de responder este cliente.</p>
              </div>
              <Switch
                checked={form.agent_stop_on_end}
                onCheckedChange={v => setForm(f => ({ ...f, agent_stop_on_end: v }))}
              />
            </div>
          </div>

          {/* API Key + Modelo */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound size={15} className="text-muted-foreground" />
              <p className="text-sm font-medium text-slate-900">OpenAI</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">API Key</Label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={form.openai_api_key}
                    onChange={e => setForm(f => ({ ...f, openai_api_key: e.target.value }))}
                    placeholder="sk-..."
                    autoComplete="new-password"
                    className="h-10 pr-10 font-mono text-sm"
                  />
                  <button type="button" onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700">
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">platform.openai.com → API keys</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Modelo</Label>
                <Select value={form.openai_model} onValueChange={v => setForm(f => ({ ...f, openai_model: v ?? '' }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini (rápido e econômico)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (rápido e econômico)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (mais inteligente)</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (legado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Janela de contexto</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={form.agent_context_window}
                    onChange={e => setForm(f => ({ ...f, agent_context_window: Number(e.target.value) }))}
                    className="h-10 w-24"
                  />
                  <span className="text-sm text-muted-foreground">mensagens</span>
                </div>
                <p className="text-xs text-muted-foreground">Mensagens anteriores que o agente lê para ter contexto.</p>
              </div>
            </div>
          </div>

          {/* Comportamento */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <p className="text-sm font-medium text-slate-900">Comportamento</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Delay de acúmulo (debounce)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={form.agent_debounce_seconds}
                    onChange={e => setForm(f => ({ ...f, agent_debounce_seconds: Number(e.target.value) }))}
                    className="h-10 w-24"
                  />
                  <span className="text-sm text-muted-foreground">segundos</span>
                </div>
                <p className="text-xs text-muted-foreground">Tempo que o agente aguarda para acumular mensagens antes de responder.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Tamanho por mensagem</Label>
                <Select
                  value={msgSizeMode}
                  onValueChange={(v) => {
                    const mode = v as 'small' | 'medium' | 'large' | 'custom'
                    setMsgSizeMode(mode)
                    if (mode === 'small') setForm(f => ({ ...f, agent_max_message_chars: 150 }))
                    else if (mode === 'medium') setForm(f => ({ ...f, agent_max_message_chars: 300 }))
                    else if (mode === 'large') setForm(f => ({ ...f, agent_max_message_chars: 500 }))
                  }}
                >
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequena (~150 caracteres)</SelectItem>
                    <SelectItem value="medium">Média (~300 caracteres)</SelectItem>
                    <SelectItem value="large">Grande (~500 caracteres)</SelectItem>
                    <SelectItem value="custom">Personalizada</SelectItem>
                  </SelectContent>
                </Select>
                {msgSizeMode === 'custom' && (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      min={80}
                      max={1000}
                      value={form.agent_max_message_chars}
                      onChange={e => setForm(f => ({ ...f, agent_max_message_chars: Number(e.target.value) }))}
                      className="h-10 w-24"
                    />
                    <span className="text-sm text-muted-foreground">caracteres</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Mensagens longas são quebradas em partes para parecer mais humano.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Velocidade de digitação</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={form.agent_typing_speed_ms}
                    onChange={e => setForm(f => ({ ...f, agent_typing_speed_ms: Number(e.target.value) }))}
                    className="h-10 w-24"
                  />
                  <span className="text-sm text-muted-foreground">ms/caractere</span>
                </div>
                <p className="text-xs text-muted-foreground">Tempo de digitação por caractere antes de enviar cada mensagem. Padrão: 20ms.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Cooldown após mensagem humana</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={form.agent_cooldown_minutes}
                    onChange={e => setForm(f => ({ ...f, agent_cooldown_minutes: Number(e.target.value) }))}
                    className="h-10 w-24"
                  />
                  <span className="text-sm text-muted-foreground">minutos</span>
                </div>
                <p className="text-xs text-muted-foreground">O bot fica em silêncio por este período após uma mensagem enviada pelo atendente humano.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Limite de mensagens por hora</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={form.agent_rate_limit}
                    onChange={e => setForm(f => ({ ...f, agent_rate_limit: Number(e.target.value) }))}
                    className="h-10 w-24"
                  />
                  <span className="text-sm text-muted-foreground">mensagens/hora por lead</span>
                </div>
                <p className="text-xs text-muted-foreground">Se um lead ultrapassar esse limite, o agente é pausado automaticamente e você recebe um aviso. Útil para evitar loops infinitos.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Número para notificação</Label>
                <Input
                  type="tel"
                  value={form.notification_phone}
                  onChange={e => setForm(f => ({ ...f, notification_phone: e.target.value }))}
                  placeholder="5511999990000"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">Recebe aviso via WhatsApp quando um cliente pedir atendimento humano. Formato: DDI + DDD + número.</p>
              </div>
            </div>
          </div>

        </TabsContent>

        {/* ── Tab: WhatsApp ──────────────────────────────────────────────── */}
        <TabsContent value="whatsapp" className="outline-none">
          <WhatsAppConnect storeId={storeId} />
        </TabsContent>

        {/* ── Tab: Conhecimento ──────────────────────────────────────────── */}
        <TabsContent value="knowledge" className="outline-none">
          <KnowledgeEditor storeId={storeId} />
        </TabsContent>

        {/* ── Tab: Follow-up ─────────────────────────────────────────────── */}
        <TabsContent value="followup" className="outline-none">
          <FollowUpConfig
            storeId={storeId}
            initialEnabled={followUpEnabled}
            initialConfig={followUpConfig}
          />
        </TabsContent>

        {/* ── Tab: Horários ──────────────────────────────────────────────── */}
        <TabsContent value="hours" className="outline-none">
          <AgentHours storeId={storeId} initialHours={agentHours} />
        </TabsContent>
      </Tabs>

    </div>
  )
}
