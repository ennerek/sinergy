import { createClient } from '@/lib/supabase/server';
import HomeClient from './HomeClient';

function intersect(a: string[], b: string[]): string[] {
  return a.filter(x => b.includes(x));
}

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileRes, othersRes, synergiesRes, projectRes] = await Promise.all([
    supabase.from('profiles').select('*, user_groups(group_id, groups(name,icon,slug))').eq('id', user!.id).single(),
    supabase.from('profiles').select('id, full_name, company_name, sector, access_level, synergy_interests, offerings').neq('id', user!.id),
    supabase.from('synergies').select('id').eq('user_id', user!.id).eq('is_active', true),
    supabase.from('ngo_projects').select('*').eq('is_active', true).single(),
  ]);

  const [pulseRes, networkRes] = await Promise.all([
    supabase.from('user_weekly_pulse').select('open_requests, network_count').eq('user_id', user!.id).single(),
    supabase.from('connections').select('id').or(`user_id_a.eq.${user!.id},user_id_b.eq.${user!.id}`),
  ]);

  const myInterests: string[] = profileRes.data?.synergy_interests ?? [];
  const myOfferings: string[] = profileRes.data?.offerings ?? [];

  const dynamicMatches = (othersRes.data ?? [])
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
      user_id_a: user!.id,
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

  return (
    <HomeClient
      profile={{
        ...profileRes.data,
        full_name: profileRes.data?.full_name || user!.user_metadata?.full_name || '',
      }}
      matches={dynamicMatches}
      synergiesCount={synergiesRes.data?.length ?? 0}
      project={projectRes.data}
      pulse={pulseRes.data}
      networkCount={networkRes.data?.length ?? 0}
    />
  );
}
