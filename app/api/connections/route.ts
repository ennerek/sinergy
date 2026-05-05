import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('connections')
    .select('*, a:profiles!connections_user_id_a_fkey(id, full_name, sector), b:profiles!connections_user_id_b_fkey(id, full_name, sector)')
    .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
    .order('created_at', { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetUserId, matchId, message } = await request.json();
  if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
  if (targetUserId === user.id) return NextResponse.json({ error: 'Cannot connect to self' }, { status: 400 });

  // Check for existing request in both directions
  const { data: existing } = await supabase
    .from('connection_requests')
    .select('id, from_user_id, to_user_id')
    .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${targetUserId}),and(from_user_id.eq.${targetUserId},to_user_id.eq.${user.id})`)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    // Mutual interest — create connection
    if (existing.from_user_id === targetUserId) {
      const [a, b] = [user.id, targetUserId].sort();
      const { error: connError } = await supabase
        .from('connections')
        .upsert({ user_id_a: a, user_id_b: b, request_id: existing.id }, { onConflict: 'user_id_a,user_id_b' });
      if (connError) return NextResponse.json({ error: connError.message }, { status: 500 });

      const { error: reqError } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted' })
        .eq('id', existing.id);
      if (reqError) return NextResponse.json({ error: reqError.message }, { status: 500 });

      return NextResponse.json({ connected: true });
    }
    return NextResponse.json({ queued: true, message: 'Request already sent' });
  }

  // Create new request
  const { error } = await supabase.from('connection_requests').insert({
    from_user_id: user.id,
    to_user_id: targetUserId,
    match_id: matchId ?? null,
    message: message ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ queued: true }, { status: 201 });
}
