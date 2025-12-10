import { NextRequest, NextResponse } from 'next/server';
import { generateWithGPT, generateWithGemini, generateWithLocal, generateWithHF } from '@/lib/llm';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit Check
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    checkRateLimit(ip, { windowMs: 60 * 1000, max: 10 }); // 10 requests per minute

    const { model, transcript, provider } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    let result = '';

    if (provider === 'openai') {
      result = await generateWithGPT(model, transcript);
    } else if (provider === 'gemini') {
      result = await generateWithGemini(model, transcript);
    } else if (provider === 'local') {
      result = await generateWithLocal(model, transcript);
    } else if (provider === 'huggingface') {
      result = await generateWithHF(model, transcript);
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('API Generate Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
