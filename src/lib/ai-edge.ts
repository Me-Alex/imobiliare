/**
 * Edge-compatible AI helper.
 * On local dev: uses z-ai-web-dev-sdk
 * On Cloudflare Edge: uses fetch to internal API (with fallback)
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message?: { content?: string }
  }>
}

// Try to use SDK on Node.js, fetch on edge
async function createCompletion(messages: ChatMessage[]): Promise<string> {
  const isEdge = typeof (globalThis as Record<string, unknown>).EdgeRuntime !== 'undefined'

  if (!isEdge) {
    // Node.js: use z-ai-web-dev-sdk
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })
    return completion.choices[0]?.message?.content || ''
  }

  // Edge: use fetch to the internal API
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWY3MjI4YzAtYjkwNi00OGM3LWI4YzctODM1NTQ4NjdiOGIyIiwiY2hhdF9pZCI6ImNoYXQtYTZjZjAxMmMtNGZlNC00ZGUwLWE5YzctMTE2OWM4Yjc5YmQyIiwicGxhdGZvcm0iOiJ6YWkifQ.HLJ1wT-IvxLnGZBf1NMBfkbx687AbstiUTBx5DhaFLA'

    const resp = await fetch('https://internal-api.z.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'default',
        messages,
        thinking: { type: 'disabled' },
      }),
    })

    if (!resp.ok) throw new Error(`API returned ${resp.status}`)
    const data = (await resp.json()) as ChatCompletionResponse
    return data.choices[0]?.message?.content || ''
  } catch {
    throw new Error('AI service unavailable on this platform')
  }
}

export async function aiChat(systemPrompt: string, userMessage: string, history?: ChatMessage[]): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'assistant', content: systemPrompt },
    ...(history || []),
    { role: 'user', content: userMessage },
  ]
  return createCompletion(messages)
}

export async function aiCompletion(systemPrompt: string, userMessage: string): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'assistant', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]
  return createCompletion(messages)
}