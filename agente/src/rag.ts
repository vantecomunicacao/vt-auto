import OpenAI from 'openai'
import { supabase } from './db'

export async function searchKnowledge(storeId: string, query: string, apiKey: string): Promise<string> {
  try {
    const openai = new OpenAI({ apiKey })
    const embRes = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: query })
    const embedding = embRes.data[0].embedding

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.78,
      match_count: 4,
      p_store_id: storeId,
    })

    if (error || !data?.length) return ''
    return (data as { content: string }[]).map(d => d.content).join('\n\n---\n\n')
  } catch {
    return ''
  }
}

export async function addKnowledge(storeId: string, title: string, content: string, apiKey: string): Promise<void> {
  const openai = new OpenAI({ apiKey })
  const embRes = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: content })
  const embedding = embRes.data[0].embedding

  const { error } = await supabase.from('knowledge_base').insert({ store_id: storeId, title, content, embedding })
  if (error) throw new Error(error.message)
}

export async function deleteKnowledge(id: string): Promise<void> {
  const { error } = await supabase.from('knowledge_base').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listKnowledge(storeId: string) {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id, title, content, created_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}
