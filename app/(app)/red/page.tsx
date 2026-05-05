import { createClient } from '@/lib/supabase/server';
import RedClient from './RedClient';

export default async function RedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileRes, userGroupsRes, connectionsRes, reflectionsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, access_level').eq('id', user!.id).single(),
    supabase
      .from('user_groups')
      .select('is_direct, groups(id, name, icon, color, tier_required, member_count, slug)')
      .eq('user_id', user!.id),
    supabase
      .from('connections')
      .select('id, created_at, user_id_a, user_id_b')
      .or(`user_id_a.eq.${user!.id},user_id_b.eq.${user!.id}`)
      .order('created_at', { ascending: false }),
    supabase
      .from('reflections')
      .select('id, user_id, content, reply_count, save_count, created_at, profiles(full_name, sector)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  // Resolve the "other" profile for each connection in a second query
  const rawConnections = connectionsRes.data ?? [];
  const otherIds = [...new Set(rawConnections.map((c: any) =>
    c.user_id_a === user!.id ? c.user_id_b : c.user_id_a
  ))];

  let profilesById: Record<string, any> = {};
  if (otherIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, company_name, sector')
      .in('id', otherIds);
    for (const p of profilesData ?? []) profilesById[p.id] = p;
  }

  const connections = rawConnections.map((c: any) => {
    const otherId = c.user_id_a === user!.id ? c.user_id_b : c.user_id_a;
    return { id: c.id, created_at: c.created_at, other: profilesById[otherId] ?? null };
  });

  return (
    <RedClient
      profile={profileRes.data}
      userGroups={userGroupsRes.data ?? []}
      connectionsCount={connections.length}
      connections={connections}
      currentUserId={user!.id}
      reflections={reflectionsRes.data ?? []}
    />
  );
}
