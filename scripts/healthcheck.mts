/**
 * Healthcheck — smoke test contra os pontos onde o sistema costuma quebrar:
 *  1. Agente respondendo direto (porta interna ou domínio do app)
 *  2. Agente alcançável via PUBLIC_URL (proxy/ngrok que a Evolution chama)
 *  3. Supabase reachable
 *  4. ENCRYPTION_KEY consegue descriptografar a openai_api_key da loja teste
 *  5. Evolution API alcançável + instância da loja teste com state=open
 *  6. Webhook configurado na Evolution bate com PUBLIC_URL/webhook/<secret>
 *
 * Uso:
 *   npx tsx scripts/healthcheck.mts                # local (padrão)
 *   npx tsx scripts/healthcheck.mts --env=prod     # produção
 *
 * Para `--env=prod`, criar `.env.prod.healthcheck` com as vars de produção
 * (template no final deste arquivo). Esse arquivo NÃO entra no git.
 */
import fs from 'fs'
import path from 'path'
import { createDecipheriv } from 'crypto'

type CheckResult = { name: string; ok: boolean; detail: string; ms: number }

function parseEnvFile(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {}
  const out: Record<string, string> = {}
  for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return out
}

function loadEnv(target: 'local' | 'prod'): Record<string, string> {
  const root = path.resolve(import.meta.dirname, '..')
  if (target === 'prod') {
    const file = path.join(root, '.env.prod.healthcheck')
    if (!fs.existsSync(file)) {
      console.error(`Arquivo ${file} não encontrado. Crie a partir do template no final de scripts/healthcheck.mts`)
      process.exit(2)
    }
    return parseEnvFile(file)
  }
  // local: junta .env.local (Next.js) com agente/.env (agente)
  const next = parseEnvFile(path.join(root, '.env.local'))
  const agente = parseEnvFile(path.join(root, 'agente', '.env'))
  return {
    AGENT_URL: next.NEXT_PUBLIC_AGENT_URL ?? 'http://localhost:3001',
    PUBLIC_URL: agente.PUBLIC_URL ?? '',
    SUPABASE_URL: next.NEXT_PUBLIC_SUPABASE_URL ?? agente.SUPABASE_URL ?? '',
    SUPABASE_SERVICE_KEY: next.SUPABASE_SERVICE_KEY ?? agente.SUPABASE_SERVICE_KEY ?? '',
    EVOLUTION_API_URL: next.EVOLUTION_API_URL ?? agente.EVOLUTION_API_URL ?? '',
    EVOLUTION_API_KEY: next.EVOLUTION_API_KEY ?? agente.EVOLUTION_API_KEY ?? '',
    EVOLUTION_WEBHOOK_SECRET: agente.EVOLUTION_WEBHOOK_SECRET ?? '',
    ENCRYPTION_KEY: next.ENCRYPTION_KEY ?? agente.ENCRYPTION_KEY ?? '',
    TEST_STORE_ID: '', // descoberto automaticamente no check 4
  }
}

function decrypt(ciphertext: string, hexKey: string): string {
  const parts = ciphertext.split(':')
  if (parts.length !== 3) throw new Error('formato inválido')
  const [iv, tag, enc] = parts.map(p => Buffer.from(p, 'hex'))
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(hexKey, 'hex'), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value?: T; err?: unknown; ms: number }> {
  const t0 = Date.now()
  try {
    const value = await fn()
    return { value, ms: Date.now() - t0 }
  } catch (err) {
    return { err, ms: Date.now() - t0 }
  }
}

async function fetchWithTimeout(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 8000)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function check1AgentDirect(env: Record<string, string>): Promise<CheckResult> {
  const url = `${env.AGENT_URL}/health`
  const { value, err, ms } = await timed(() => fetchWithTimeout(url))
  if (err) return { name: 'agente direto', ok: false, detail: `${url} — ${(err as Error).message}`, ms }
  return { name: 'agente direto', ok: value!.ok, detail: `${url} HTTP ${value!.status}`, ms }
}

async function check2AgentPublic(env: Record<string, string>): Promise<CheckResult> {
  if (!env.PUBLIC_URL) return { name: 'agente público (PUBLIC_URL)', ok: false, detail: 'PUBLIC_URL vazio', ms: 0 }
  const url = `${env.PUBLIC_URL}/health`
  const { value, err, ms } = await timed(() => fetchWithTimeout(url))
  if (err) return { name: 'agente público (PUBLIC_URL)', ok: false, detail: `${url} — ${(err as Error).message}`, ms }
  return { name: 'agente público (PUBLIC_URL)', ok: value!.ok, detail: `${url} HTTP ${value!.status}`, ms }
}

async function check3Supabase(env: Record<string, string>): Promise<CheckResult> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { name: 'Supabase reachable', ok: false, detail: 'SUPABASE_URL ou SUPABASE_SERVICE_KEY ausente', ms: 0 }
  }
  const url = `${env.SUPABASE_URL}/rest/v1/stores?select=id&limit=1`
  const { value, err, ms } = await timed(() => fetchWithTimeout(url, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
  }))
  if (err) return { name: 'Supabase reachable', ok: false, detail: (err as Error).message, ms }
  return { name: 'Supabase reachable', ok: value!.ok, detail: `HTTP ${value!.status}`, ms }
}

async function check4EncryptionKey(env: Record<string, string>): Promise<CheckResult & { storeId?: string; instance?: string }> {
  if (!env.ENCRYPTION_KEY || env.ENCRYPTION_KEY.length !== 64) {
    return { name: 'ENCRYPTION_KEY decifra openai_api_key', ok: false, detail: 'ENCRYPTION_KEY ausente ou tamanho inválido', ms: 0 }
  }
  // Prefere loja que tem whatsapp_instance configurada (cobre os checks 5 e 6).
  const url = `${env.SUPABASE_URL}/rest/v1/stores?openai_api_key=not.is.null&whatsapp_instance=not.is.null&select=id,whatsapp_instance,openai_api_key&limit=1`
  const { value, err, ms } = await timed(() => fetchWithTimeout(url, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
  }))
  if (err) return { name: 'ENCRYPTION_KEY decifra openai_api_key', ok: false, detail: (err as Error).message, ms }
  const rows = await value!.json() as Array<{ id: string; whatsapp_instance: string | null; openai_api_key: string }>
  if (!rows.length) return { name: 'ENCRYPTION_KEY decifra openai_api_key', ok: false, detail: 'nenhuma loja com openai_api_key configurada', ms }
  const store = rows[0]
  try {
    const plain = decrypt(store.openai_api_key, env.ENCRYPTION_KEY)
    if (!plain.startsWith('sk-')) {
      return {
        name: 'ENCRYPTION_KEY decifra openai_api_key', ok: false,
        detail: `decifrou mas resultado não começa com 'sk-' (loja ${store.id}) — possível duplo encrypt`, ms,
        storeId: store.id, instance: store.whatsapp_instance ?? undefined,
      }
    }
    return {
      name: 'ENCRYPTION_KEY decifra openai_api_key', ok: true,
      detail: `loja ${store.id} → ${plain.slice(0, 7)}…`, ms,
      storeId: store.id, instance: store.whatsapp_instance ?? undefined,
    }
  } catch (e) {
    return {
      name: 'ENCRYPTION_KEY decifra openai_api_key', ok: false,
      detail: `decrypt falhou (loja ${store.id}): ${(e as Error).message}`, ms,
      storeId: store.id, instance: store.whatsapp_instance ?? undefined,
    }
  }
}

async function check5EvolutionInstance(env: Record<string, string>, instance: string | undefined): Promise<CheckResult> {
  if (!env.EVOLUTION_API_URL || !env.EVOLUTION_API_KEY) {
    return { name: 'Evolution instance state', ok: false, detail: 'EVOLUTION_API_URL ou EVOLUTION_API_KEY ausente', ms: 0 }
  }
  if (!instance) return { name: 'Evolution instance state', ok: false, detail: 'whatsapp_instance da loja teste é null', ms: 0 }
  const base = env.EVOLUTION_API_URL.replace(/\/$/, '')
  const url = `${base}/instance/connectionState/${instance}`
  const { value, err, ms } = await timed(() => fetchWithTimeout(url, { headers: { apikey: env.EVOLUTION_API_KEY } }))
  if (err) return { name: 'Evolution instance state', ok: false, detail: (err as Error).message, ms }
  if (!value!.ok) return { name: 'Evolution instance state', ok: false, detail: `HTTP ${value!.status}`, ms }
  const body = await value!.json() as { instance?: { state?: string } }
  const state = body.instance?.state ?? '?'
  return { name: 'Evolution instance state', ok: state === 'open', detail: `${instance} → ${state}`, ms }
}

async function check6EvolutionWebhook(env: Record<string, string>, instance: string | undefined): Promise<CheckResult> {
  if (!instance) return { name: 'Evolution webhook bate com PUBLIC_URL', ok: false, detail: 'whatsapp_instance é null', ms: 0 }
  if (!env.PUBLIC_URL || !env.EVOLUTION_WEBHOOK_SECRET) {
    return { name: 'Evolution webhook bate com PUBLIC_URL', ok: false, detail: 'PUBLIC_URL ou EVOLUTION_WEBHOOK_SECRET ausente', ms: 0 }
  }
  const base = env.EVOLUTION_API_URL.replace(/\/$/, '')
  const url = `${base}/webhook/find/${instance}`
  const expected = `${env.PUBLIC_URL.replace(/\/$/, '')}/webhook/${env.EVOLUTION_WEBHOOK_SECRET}`
  const { value, err, ms } = await timed(() => fetchWithTimeout(url, { headers: { apikey: env.EVOLUTION_API_KEY } }))
  if (err) return { name: 'Evolution webhook bate com PUBLIC_URL', ok: false, detail: (err as Error).message, ms }
  if (!value!.ok) return { name: 'Evolution webhook bate com PUBLIC_URL', ok: false, detail: `HTTP ${value!.status}`, ms }
  const body = await value!.json() as { url?: string; enabled?: boolean }
  if (body.url !== expected) {
    return { name: 'Evolution webhook bate com PUBLIC_URL', ok: false, detail: `divergente. cadastrado=${body.url} esperado=${expected}`, ms }
  }
  if (!body.enabled) return { name: 'Evolution webhook bate com PUBLIC_URL', ok: false, detail: 'webhook desabilitado', ms }
  return { name: 'Evolution webhook bate com PUBLIC_URL', ok: true, detail: `OK e enabled`, ms }
}

function pad(n: number, w: number): string { return String(n).padStart(w, ' ') }

async function main(): Promise<void> {
  const target = (process.argv.find(a => a.startsWith('--env='))?.split('=')[1] ?? 'local') as 'local' | 'prod'
  if (target !== 'local' && target !== 'prod') {
    console.error('--env precisa ser local ou prod')
    process.exit(2)
  }
  console.log(`\nHealthcheck (${target})\n`)
  const env = loadEnv(target)

  const results: CheckResult[] = []
  results.push(await check1AgentDirect(env))
  results.push(await check2AgentPublic(env))
  results.push(await check3Supabase(env))
  const c4 = await check4EncryptionKey(env)
  results.push(c4)
  results.push(await check5EvolutionInstance(env, c4.instance))
  results.push(await check6EvolutionWebhook(env, c4.instance))

  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    const mark = r.ok ? '✓' : '✗'
    console.log(`[${i + 1}/${results.length}] ${mark} ${r.name.padEnd(40)} ${pad(r.ms, 5)}ms  ${r.detail}`)
  }
  const failed = results.filter(r => !r.ok).length
  console.log(failed === 0 ? '\nAll checks passed.' : `\n${failed} check(s) failed.`)
  process.exit(failed === 0 ? 0 : 1)
}

void main()

/*
Template para .env.prod.healthcheck:

AGENT_URL=https://agente.cargrow.com.br
PUBLIC_URL=https://agente.cargrow.com.br
SUPABASE_URL=https://tcbsmfnluiamtmwkfdfl.supabase.co
SUPABASE_SERVICE_KEY=...
EVOLUTION_API_URL=https://evolution.boliqf.easypanel.host/
EVOLUTION_API_KEY=...
EVOLUTION_WEBHOOK_SECRET=...
ENCRYPTION_KEY=...
*/
