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
    supabase
      .from('connections')
      .select('id, created_at, user_id_a, user_id_b, a:profiles!connections_user_id_a_fkey(id, full_name, company_name, sector), b:profiles!connections_user_id_b_fkey(id, full_name, company_name, sector)')
      .or(`user_id_a.eq.${user!.id},user_id_b.eq.${user!.id}`)
      .order('created_at', { ascending: false }),
  ]);

  // Normalize: always give us the "other" person
  const connections = (connectionsRes.data ?? []).map((c: any) => ({
    id: c.id,
    created_at: c.created_at,
    other: c.user_id_a === user!.id ? c.b : c.a,
  }));

  return (
    <RedClient
      profile={profileRes.data}
      userGroups={userGroupsRes.data ?? []}
      connectionsCount={connections.length}
      connections={connections}
      currentUserId={user!.id}
    />
  );
}
