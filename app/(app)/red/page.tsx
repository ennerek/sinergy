import { createClient } from '@/lib/supabase/server';
import RedClient from './RedClient';

export default async function RedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileRes, userGroupsRes, connectionsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, access_level').eq('id', user!.id).single(),
    supabase
      .from('user_groups')
      .select('is_direct, groups(id, name, icon, color, tier_required, member_count, slug)')
      .eq('user_id', user!.id),
    supabase.from('connections').select('id').or(`user_id_a.eq.${user!.id},user_id_b.eq.${user!.id}`),
  ]);

  return (
    <RedClient
      profile={profileRes.data}
      userGroups={userGroupsRes.data ?? []}
      connectionsCount={connectionsRes.data?.length ?? 0}
    />
  );
}
