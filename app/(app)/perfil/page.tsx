import { createClient } from '@/lib/supabase/server';
import PerfilClient from './PerfilClient';

function intersect(a: string[], b: string[]): number {
  return a.filter(x => b.includes(x)).length;
}

export default async function PerfilPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileRes, synergiesRes, connectionsRes, othersRes] = await Promise.all([
    supabase.from('profiles').select('*, user_groups(is_direct, groups(name, icon, slug))').eq('id', user!.id).single(),
    supabase.from('synergies').select('id').eq('user_id', user!.id).eq('is_active', true),
    supabase.from('connections').select('id').or(`user_id_a.eq.${user!.id},user_id_b.eq.${user!.id}`),
    supabase.from('profiles').select('synergy_interests, offerings').neq('id', user!.id),
  ]);

  const myInterests: string[] = profileRes.data?.synergy_interests ?? [];
  const myOfferings: string[] = profileRes.data?.offerings ?? [];
  const matchesCount = (othersRes.data ?? []).filter(other =>
    intersect(other.offerings ?? [], myInterests) > 0 ||
    intersect(other.synergy_interests ?? [], myOfferings) > 0
  ).length;

  return (
    <PerfilClient
      profile={profileRes.data}
      synergiesCount={synergiesRes.data?.length ?? 0}
      connectionsCount={connectionsRes.data?.length ?? 0}
      matchesCount={matchesCount}
    />
  );
}
