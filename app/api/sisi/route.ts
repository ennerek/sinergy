import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { askSisi, type SisiMessage } from '@/lib/sisi';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, history } = await request.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  const safeHistory: SisiMessage[] = Array.isArray(history)
    ? history
        .filter((item): item is SisiMessage =>
          !!item &&
          (item.role === 'user' || item.role === 'assistant') &&
          typeof item.content === 'string'
        )
        .slice(-12)
    : [];

  try {
    const reply = await askSisi(user.id, message, safeHistory);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('SISI error:', err);
    const message = err instanceof Error ? err.message : 'AI service error';
    const status = message.includes('ANTHROPIC_API_KEY') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
