import { createClient } from '@/lib/supabase/server';
import MentoresClient from './MentoresClient';

export default async function MentoresPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [reflectionsRes, mentorsRes, profileRes] = await Promise.all([
    supabase
      .from('reflections')
      .select('*, profiles!reflections_user_id_fkey(full_name, sector), reflection_replies(id)')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('profiles')
      .select('id, full_name, company_name, sector, bio, is_mentor, access_level')
      .eq('is_mentor', true)
      .limit(12),
    supabase.from('profiles').select('id, full_name, access_level, is_mentor').eq('id', user!.id).single(),
  ]);

  return (
    <MentoresClient
      currentUserId={user!.id}
      profile={profileRes.data}
      reflections={reflectionsRes.data ?? []}
      mentors={mentorsRes.data ?? []}
    />
  );
}
