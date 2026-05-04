import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PerfilClient from './PerfilClient';

function intersect(a: string[], b: string[]): number {
  return a.filter(x => b.includes(x)).length;
}

export default async function PerfilPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [profileRes, userGroupsRes, synergiesRes, connectionsRes, othersRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_groups').select('is_direct, groups(name, icon, slug)').eq('user_id', user.id),
    supabase.from('synergies').select('id').eq('user_id', user.id).eq('is_active', true),
    supabase.from('connections').select('id').or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`),
    supabase.from('profiles').select('synergy_interests, offerings').neq('id', user.id),
  ]);

  const profile = profileRes.data
    ? {
        ...profileRes.data,
        user_groups: userGroupsRes.data ?? [],
      }
    : null;

  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding');
  }

  const myInterests: string[] = profile?.synergy_interests ?? [];
  const myOfferings: string[] = profile?.offerings ?? [];
  const matchesCount = (othersRes.data ?? []).filter(other =>
    intersect(other.offerings ?? [], myInterests) > 0 ||
    intersect(other.synergy_interests ?? [], myOfferings) > 0
  ).length;

  return (
    <PerfilClient
      profile={profile}
      synergiesCount={synergiesRes.data?.length ?? 0}
      connectionsCount={connectionsRes.data?.length ?? 0}
      matchesCount={matchesCount}
    />
  );
}
