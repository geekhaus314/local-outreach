import type { ChatMessage } from '$lib/server/ollama.types';

const OLLAMA_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'qwen2.5-coder:7b';

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
      options: {
        temperature: options.temperature ?? 0.4
      }
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

export { OLLAMA_MODEL, OLLAMA_URL };
