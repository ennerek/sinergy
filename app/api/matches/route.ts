import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('access_level')
    .eq('id', user.id)
    .single();

  const userLevel = profile?.access_level ?? 1;

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      a:profiles!matches_user_id_a_fkey(id, full_name, company_name, sector, access_level),
      b:profiles!matches_user_id_b_fkey(id, full_name, company_name, sector, access_level)
    `)
    .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
    .eq('status', 'pending')
    .order('score', { ascending: false });

  const result = (matches ?? []).map(m => {
    const isLocked = (m.requires_level ?? 1) > userLevel;
    const other = m.user_id_a === user.id ? m.b : m.a;

    if (isLocked) {
      return {
        id: m.id,
        score: m.score,
        requires_level: m.requires_level,
        score_reasons: [],
        is_locked: true,
        other: { full_name: '███ ███████', company_name: '██████', sector: '██████' },
      };
    }

    return {
      id: m.id,
      score: m.score,
      requires_level: m.requires_level,
      score_reasons: m.score_reasons,
      is_locked: false,
      other,
    };
  });

  return NextResponse.json(result);
}
