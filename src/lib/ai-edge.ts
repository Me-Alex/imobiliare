/**
 * Server-side adapter for the AI provider.
 *
 * Keep the credential in ZAI_API_KEY (a Cloudflare Worker secret in
 * production). This module is imported only by route handlers; it must never
 * be imported from a Client Component.
 */

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message?: { content?: string }
  }>
}

export class AIServiceConfigurationError extends Error {
  constructor() {
    super('AI service is not configured')
    this.name = 'AIServiceConfigurationError'
  }
}

export class AIServiceUnavailableError extends Error {
  constructor() {
    super('AI service is unavailable')
    this.name = 'AIServiceUnavailableError'
  }
}

async function createCompletion(messages: AIChatMessage[]): Promise<string> {
  const apiKey = process.env.ZAI_API_KEY
  if (!apiKey) throw new AIServiceConfigurationError()

  const response = await fetch(
    process.env.ZAI_API_URL || 'https://internal-api.z.ai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: process.env.ZAI_MODEL || 'default',
        messages,
        thinking: { type: 'disabled' },
      }),
    },
  )

  if (!response.ok) {
    throw new AIServiceUnavailableError()
  }

  const data = await response.json() as ChatCompletionResponse
  const content = data.choices[0]?.message?.content?.trim()
  if (!content) throw new AIServiceUnavailableError()
  return content
}

export async function aiChat(
  systemPrompt: string,
  userMessage: string,
  history: AIChatMessage[] = [],
): Promise<string> {
  return createCompletion([
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ])
}

export async function aiCompletion(systemPrompt: string, userMessage: string): Promise<string> {
  return createCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ])
}
