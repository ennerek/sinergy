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
    const { error: connError } = await supabase
      .from('connections')
      .upsert({ user_id_a: a, user_id_b: b, request_id: req.id }, { onConflict: 'user_id_a,user_id_b' });
    if (connError) return NextResponse.json({ error: connError.message }, { status: 500 });

    const { error: reqError } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted', to_responded_at: new Date().toISOString() })
      .eq('id', params.id);
    if (reqError) return NextResponse.json({ error: reqError.message }, { status: 500 });

    // No rejection notification per privacy rule
    return NextResponse.json({ connected: true });
  } else {
    // Silently decline — no notification sent
    await supabase.from('connection_requests').update({ status: 'declined' }).eq('id', params.id);
    return NextResponse.json({ ok: true });
  }
}
