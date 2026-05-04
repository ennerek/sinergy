import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HomeClient from './HomeClient';

function intersect(a: string[], b: string[]): string[] {
  return a.filter(x => b.includes(x));
}

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [profileRes, userGroupsRes, synergiesRes, projectRes, matchesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_groups').select('group_id, groups(name,icon,slug)').eq('user_id', user.id),
    supabase.from('synergies').select('id').eq('user_id', user.id).eq('is_active', true),
    supabase.from('ngo_projects').select('*').eq('is_active', true).single(),
    supabase
      .from('matches')
      .select(`
        *,
        a:profiles!matches_user_id_a_fkey(id, full_name, company_name, sector, access_level),
        b:profiles!matches_user_id_b_fkey(id, full_name, company_name, sector, access_level)
      `)
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .eq('status', 'pending')
      .order('score', { ascending: false })
      .limit(10),
  ]);

  const [pulseRes, networkRes] = await Promise.all([
    supabase.from('user_weekly_pulse').select('open_requests, network_count').eq('user_id', user.id).single(),
    supabase.from('connections').select('id').or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`),
  ]);

  const profile = profileRes.data
    ? {
        ...profileRes.data,
        user_groups: userGroupsRes.data ?? [],
      }
    : null;
  if (!profile?.onboarding_completed) redirect('/onboarding');
  const userLevel: number = profile?.access_level ?? 1;

  // Synergy-based matches (from matches table)
  const synergyMatches = (matchesRes.data ?? []).map(m => {
    const isLocked = (m.requires_level ?? 1) > userLevel;
    const other = m.user_id_a === user!.id ? m.a : m.b;
    return {
      id: m.id as string | null,
      user_id_a: m.user_id_a,
      user_id_b: m.user_id_b,
      score: m.score,
      score_reasons: isLocked ? [] : (m.score_reasons ?? []),
      requires_level: m.requires_level ?? 1,
      status: m.status,
      'profiles!matches_user_id_b_fkey': m.user_id_a === user!.id ? other : null,
      'profiles!matches_user_id_a_fkey': m.user_id_b === user!.id ? other : null,
    };
  });

  // Profile-based fallback if no synergy matches yet
  const myInterests: string[] = profile?.synergy_interests ?? [];
  const myOfferings: string[] = profile?.offerings ?? [];
  const { data: others } = synergyMatches.length
    ? { data: [] }
    : await supabase
        .from('profiles')
        .select('id, full_name, company_name, sector, access_level, synergy_interests, offerings')
        .neq('id', user.id);

  const dynamicMatches = (others ?? [])
    .map(other => {
      const theyOfferWhatINeed = intersect(other.offerings ?? [], myInterests);
      const theyNeedWhatIOffer = intersect(other.synergy_interests ?? [], myOfferings);
      const score = theyOfferWhatINeed.length + theyNeedWhatIOffer.length;
      return { other, score, theyOfferWhatINeed, theyNeedWhatIOffer };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(m => ({
      id: null as null,
      user_id_a: user.id,
      user_id_b: m.other.id,
      score: Math.min(100, m.score * 20),
      score_reasons: [
        ...(m.theyOfferWhatINeed.length > 0 ? [`Ofrece lo que buscas: ${m.theyOfferWhatINeed.join(', ')}`] : []),
        ...(m.theyNeedWhatIOffer.length > 0 ? [`Busca lo que ofreces: ${m.theyNeedWhatIOffer.join(', ')}`] : []),
      ],
      requires_level: 1,
      status: 'pending' as const,
      'profiles!matches_user_id_b_fkey': m.other,
      'profiles!matches_user_id_a_fkey': null,
    }));

  const matches = synergyMatches.length ? synergyMatches : dynamicMatches;

  return (
    <HomeClient
      profile={{
        ...profile,
        full_name: profile?.full_name || user.user_metadata?.full_name || '',
      }}
      matches={matches}
      synergiesCount={synergiesRes.data?.length ?? 0}
      project={projectRes.data}
      pulse={pulseRes.data}
      networkCount={networkRes.data?.length ?? 0}
    />
  );
}
