import { createClient } from '@/lib/supabase/server';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileRes, synergiesRes, connectionsRes, matchesRes] = await Promise.all([
    supabase.from('profiles').select('*, user_groups(is_direct, groups(name, icon, slug))').eq('id', user!.id).single(),
    supabase.from('synergies').select('id').eq('user_id', user!.id).eq('is_active', true),
    supabase.from('connections').select('id').or(`user_id_a.eq.${user!.id},user_id_b.eq.${user!.id}`),
    supabase.from('matches').select('id').or(`user_id_a.eq.${user!.id},user_id_b.eq.${user!.id}`).eq('status', 'pending'),
  ]);

  return (
    <PerfilClient
      profile={profileRes.data}
      synergiesCount={synergiesRes.data?.length ?? 0}
      connectionsCount={connectionsRes.data?.length ?? 0}
      matchesCount={matchesRes.data?.length ?? 0}
    />
  );
}
