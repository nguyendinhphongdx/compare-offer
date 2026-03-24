import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function testGemini(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    await model.generateContent('Hi');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

async function testOpenAI(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

async function testClaude(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { provider, apiKey, keyId } = await req.json();

  // If keyId provided, fetch key from DB
  let key = apiKey;
  if (keyId && !key) {
    const dbKey = await prisma.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!dbKey) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    key = dbKey.apiKey;
  }

  if (!provider || !key) {
    return NextResponse.json({ error: 'Missing provider or key' }, { status: 400 });
  }

  let result: { ok: boolean; error?: string };

  switch (provider) {
    case 'gemini':
      result = await testGemini(key);
      break;
    case 'openai':
      result = await testOpenAI(key);
      break;
    case 'claude':
      result = await testClaude(key);
      break;
    default:
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  }

  // Update isValid in DB if keyId provided
  if (keyId) {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isValid: result.ok },
    });
  }

  return NextResponse.json(result);
}
