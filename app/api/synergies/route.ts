import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('synergies')
    .select('*, profiles(full_name, sector)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { type, description, categories, budget_range } = body;
  if (!type || !description?.trim()) return NextResponse.json({ error: 'type and description required' }, { status: 400 });

  const { data, error } = await supabase
    .from('synergies')
    .insert({ user_id: user.id, type, description, categories: categories ?? [], budget_range: budget_range ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await supabase.from('synergies').update({ is_active: false }).eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
