import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

// ─── Types ───

export type AiProvider = 'gemini' | 'openai' | 'claude';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiStreamResult {
  stream: ReadableStream;
}

// ─── Provider Interface (Strategy) ───

interface AiProviderStrategy {
  chat(messages: AiMessage[], systemPrompt: string): Promise<AiStreamResult>;
}

// ─── Gemini ───

class GeminiProvider implements AiProviderStrategy {
  constructor(private apiKey: string) {}

  async chat(messages: AiMessage[], systemPrompt: string): Promise<AiStreamResult> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Đã hiểu. Tôi sẵn sàng!' }] },
    ];

    for (const msg of messages.slice(0, -1)) {
      history.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1]?.content || '';
    const result = await chat.sendMessageStream(lastMessage);

    return { stream: this.toSSEStream(result) };
  }

  private toSSEStream(result: { stream: AsyncIterable<{ text: () => string }> }): ReadableStream {
    const encoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        }
      },
    });
  }
}

// ─── OpenAI ───

class OpenAIProvider implements AiProviderStrategy {
  constructor(private apiKey: string) {}

  async chat(messages: AiMessage[], systemPrompt: string): Promise<AiStreamResult> {
    const body = {
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      ],
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI HTTP ${res.status}`);
    }

    return { stream: this.toSSEStream(res.body!) };
  }

  private toSSEStream(body: ReadableStream<Uint8Array>): ReadableStream {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = '';

    return new ReadableStream({
      async start(controller) {
        const reader = body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                const text = parsed.choices?.[0]?.delta?.content;
                if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              } catch { /* skip */ }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        }
      },
    });
  }
}

// ─── Claude ───

class ClaudeProvider implements AiProviderStrategy {
  constructor(private apiKey: string) {}

  async chat(messages: AiMessage[], systemPrompt: string): Promise<AiStreamResult> {
    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      stream: true,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Claude HTTP ${res.status}`);
    }

    return { stream: this.toSSEStream(res.body!) };
  }

  private toSSEStream(body: ReadableStream<Uint8Array>): ReadableStream {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = '';

    return new ReadableStream({
      async start(controller) {
        const reader = body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        }
      },
    });
  }
}

// ─── Factory ───

function createProvider(provider: AiProvider, apiKey: string): AiProviderStrategy {
  switch (provider) {
    case 'gemini': return new GeminiProvider(apiKey);
    case 'openai': return new OpenAIProvider(apiKey);
    case 'claude': return new ClaudeProvider(apiKey);
  }
}

// ─── Resolve Provider ───

export interface ResolvedProvider {
  provider: AiProvider;
  strategy: AiProviderStrategy;
  source: 'user' | 'system';
}

/**
 * Resolve AI provider for current user.
 *
 * Logic:
 * 1. If user.useSystemKey = true → use system env GEMINI_API_KEY
 * 2. If useSystemKey = false → find user's default key
 * 3. No default key → return { error } (caller should toast)
 */
export async function resolveProvider(): Promise<ResolvedProvider | { error: string }> {
  const userId = await getUserId();

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { supabaseId: userId },
      select: { useSystemKey: true },
    });

    // Option 1: Use system key
    if (user?.useSystemKey !== false) {
      const envKey = process.env.GEMINI_API_KEY;
      if (envKey && envKey !== 'your_gemini_api_key_here') {
        return {
          provider: 'gemini',
          strategy: createProvider('gemini', envKey),
          source: 'system',
        };
      }
      return { error: 'Hệ thống chưa cấu hình API key. Vui lòng dùng key cá nhân.' };
    }

    // Option 2: Use personal key
    const defaultKey = await prisma.apiKey.findFirst({
      where: { userId, isDefault: true },
    });

    if (defaultKey) {
      return {
        provider: defaultKey.provider as AiProvider,
        strategy: createProvider(defaultKey.provider as AiProvider, defaultKey.apiKey),
        source: 'user',
      };
    }

    // No default key found
    return { error: 'Bạn chưa cài đặt API key mặc định. Vào Cài đặt để thêm và chọn key mặc định.' };
  }

  return { error: 'Chưa đăng nhập.' };
}
