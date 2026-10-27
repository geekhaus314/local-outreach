import type { ChatMessage } from '$lib/server/ollama.types';

const OLLAMA_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'qwen2.5-coder:7b';

export interface AiProviderConfig {
  provider: 'ollama' | 'cloudflare';
  ollamaUrl?: string;
  ollamaModel?: string;
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
  cloudflareModel?: string;
}

export interface OllamaChatOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  stream?: boolean;
}

export async function ollamaChat(options: OllamaChatOptions): Promise<string> {
  const model = options.model ?? OLLAMA_MODEL;
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: options.messages,
      stream: options.stream ?? false,
      options: { temperature: options.temperature ?? 0.4 }
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Ollama returned ${response.status}${text ? ': ' + text : ''}`);
  }

  const data = (await response.json()) as { message?: { content: string } };
  const content = data.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Ollama returned an empty response.');
  }
  return content.trim();
}

export function resolveAiConfig(env: Record<string, string | undefined>): AiProviderConfig {
  const provider = (env.AI_PROVIDER ?? 'ollama') as 'ollama' | 'cloudflare';
  return {
    provider,
    ollamaUrl: env.OLLAMA_URL ?? OLLAMA_URL,
    ollamaModel: env.OLLAMA_MODEL ?? OLLAMA_MODEL,
    cloudflareAccountId: env.CLOUDFLARE_AI_ACCOUNT_ID,
    cloudflareApiToken: env.CLOUDFLARE_AI_API_TOKEN,
    cloudflareModel: env.CLOUDFLARE_AI_MODEL ?? '@cf/meta/llama-3.1-8b-instruct'
  };
}

export async function aiChat(config: AiProviderConfig, messages: ChatMessage[], temperature = 0.4): Promise<string> {
  if (config.provider === 'cloudflare') {
    return cloudflareAiChat(config, messages, temperature);
  }
  return ollamaChat({ model: config.ollamaModel, messages, temperature });
}

async function cloudflareAiChat(config: AiProviderConfig, messages: ChatMessage[], temperature: number): Promise<string> {
  if (!config.cloudflareAccountId || !config.cloudflareApiToken) {
    throw new Error('Cloudflare Workers AI requires CLOUDFLARE_AI_ACCOUNT_ID and CLOUDFLARE_AI_API_TOKEN env vars.');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflareAccountId}/ai/run/${config.cloudflareModel}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.cloudflareApiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages,
      temperature,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Cloudflare Workers AI returned ${response.status}${text ? ': ' + text : ''}`);
  }

  const data = (await response.json()) as {
    result?: { response: string };
    errors?: Array<{ message: string }>;
    messages?: Array<{ message: string }>;
  };

  if (data.errors?.length) {
    throw new Error(`Cloudflare Workers AI error: ${data.errors.map((e) => e.message).join('; ')}`);
  }
  if (data.messages?.length) {
    throw new Error(`Cloudflare Workers AI error: ${data.messages.map((m) => m.message).join('; ')}`);
  }

  const content = data.result?.response;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Cloudflare Workers AI returned an empty response.');
  }
  return content.trim();
}

export { OLLAMA_MODEL, OLLAMA_URL };
