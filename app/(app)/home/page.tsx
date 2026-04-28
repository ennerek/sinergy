import { createClient } from '@/lib/supabase/server';
import HomeClient from './HomeClient';

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileRes, matchesRes, synergiesRes, projectRes] = await Promise.all([
    supabase.from('profiles').select('*, user_groups(group_id, groups(name,icon,slug))').eq('id', user!.id).single(),
    supabase
      .from('matches')
      .select('*, profiles!matches_user_id_b_fkey(id, full_name, company_name, sector, access_level), profiles!matches_user_id_a_fkey(id, full_name, company_name, sector, access_level)')
      .or(`user_id_a.eq.${user!.id},user_id_b.eq.${user!.id}`)
      .eq('status', 'pending')
      .order('score', { ascending: false })
      .limit(5),
    supabase.from('synergies').select('id').eq('user_id', user!.id).eq('is_active', true),
    supabase.from('ngo_projects').select('*').eq('is_active', true).single(),
  ]);

  const [pulseRes, networkRes] = await Promise.all([
    supabase.from('user_weekly_pulse').select('*').eq('user_id', user!.id).single(),
    supabase.from('connections').select('id').or(`user_id_a.eq.${user!.id},user_id_b.eq.${user!.id}`),
  ]);

  return (
    <HomeClient
      profile={profileRes.data}
      matches={matchesRes.data ?? []}
      synergiesCount={synergiesRes.data?.length ?? 0}
      project={projectRes.data}
      pulse={pulseRes.data}
      networkCount={networkRes.data?.length ?? 0}
    />
  );
}
