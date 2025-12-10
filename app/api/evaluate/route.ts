import { NextRequest, NextResponse } from 'next/server';
import { evaluateAll } from '@/lib/eval';

export async function POST(req: NextRequest) {
  try {
    const { generated, reference } = await req.json();

    if (!generated || !reference) {
      return NextResponse.json({ error: 'Generated note and reference note are required' }, { status: 400 });
    }

    const metrics = await evaluateAll(generated, reference);

    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error('API Evaluate Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
