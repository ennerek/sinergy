import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Toggle save: saves if not saved, unsaves if already saved
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await supabase
    .from('reflection_saves')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('reflection_id', params.id)
    .single();

  if (existing) {
    await supabase
      .from('reflection_saves')
      .delete()
      .eq('user_id', user.id)
      .eq('reflection_id', params.id);
    return NextResponse.json({ saved: false });
  } else {
    await supabase
      .from('reflection_saves')
      .insert({ user_id: user.id, reflection_id: params.id });
    return NextResponse.json({ saved: true });
  }
}
