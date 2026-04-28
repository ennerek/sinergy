import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { accepted } = await request.json();

  const { data: req } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('id', params.id)
    .eq('to_user_id', user.id)
    .maybeSingle();

  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (accepted) {
    const [a, b] = [req.from_user_id, req.to_user_id].sort();
    await supabase.from('connections').upsert({ user_id_a: a, user_id_b: b, match_id: req.match_id ?? null }, { onConflict: 'user_id_a,user_id_b' });
    await supabase.from('connection_requests').update({ status: 'accepted' }).eq('id', params.id);
    // No rejection notification per privacy rule
    return NextResponse.json({ connected: true });
  } else {
    // Silently decline — no notification sent
    await supabase.from('connection_requests').update({ status: 'declined' }).eq('id', params.id);
    return NextResponse.json({ ok: true });
  }
}
