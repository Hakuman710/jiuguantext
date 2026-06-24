import type { AISettings } from '../types';

export interface AIStreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function streamChat(
  settings: AISettings,
  messages: { role: string; content: string }[],
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  switch (settings.provider) {
    case 'anthropic':
    case 'deepseek':
      return streamAnthropic(settings, messages, callbacks, signal);
    default:
      return streamOpenAICompatible(settings, messages, callbacks, signal);
  }
}

async function streamOpenAICompatible(
  settings: AISettings,
  messages: { role: string; content: string }[],
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${settings.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') {
        callbacks.onDone(fullText);
        return;
      }
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content || '';
        if (token) {
          fullText += token;
          callbacks.onToken(token);
        }
      } catch {
        // skip non-JSON lines
      }
    }
  }

  callbacks.onDone(fullText);
}

async function streamAnthropic(
  settings: AISettings,
  messages: { role: string; content: string }[],
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const systemMsg = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const chatMsgs = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: [{ type: 'text', text: m.content }] }));

  const body: Record<string, unknown> = {
    model: settings.model,
    messages: chatMsgs,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    stream: true,
  };
  if (systemMsg) body.system = systemMsg;

  const response = await fetch(`${settings.endpoint}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6).trim();
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta') {
          const token = parsed.delta?.text || '';
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }
        } else if (parsed.type === 'message_stop') {
          callbacks.onDone(fullText);
          return;
        }
      } catch {
        // skip
      }
    }
  }

  callbacks.onDone(fullText);
}
