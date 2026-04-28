import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { askSisi } from '@/lib/sisi';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message } = await request.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  try {
    const reply = await askSisi(user.id, message);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('SISI error:', err);
    return NextResponse.json({ error: 'AI service error' }, { status: 500 });
  }
}
