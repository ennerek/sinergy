import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── Scoring helpers ────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'de','la','el','en','y','a','los','las','un','una','para','con','que','del',
  'por','se','su','al','lo','más','pero','o','es','si','no','ya','mi','me',
  'te','le','nos','les','son','sus','este','esta','estos','estas',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/\W+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w)),
  );
}

function scoreCategories(catsA: string[], catsB: string[]): number {
  if (!catsA.length || !catsB.length) return 10;
  let hits = 0;
  for (const a of catsA) {
    const aL = a.toLowerCase();
    if (catsB.some(b => { const bL = b.toLowerCase(); return aL === bL || aL.includes(bL) || bL.includes(aL); })) hits++;
  }
  return Math.round((hits / Math.max(catsA.length, catsB.length)) * 50);
}

function scoreText(descA: string, descB: string): number {
  const wA = tokenize(descA);
  const wB = tokenize(descB);
  if (!wA.size || !wB.size) return 0;
  let overlap = 0;
  wA.forEach((w) => {
    if (wB.has(w)) overlap++;
  });
  const unionWords = new Set<string>();
  wA.forEach((w) => {
    unionWords.add(w);
  });
  wB.forEach((w) => {
    unionWords.add(w);
  });
  const union = unionWords.size;
  return Math.round((overlap / union) * 40);
}

function calcScore(a: { categories: string[]; description: string; budget_range: string | null },
                   b: { categories: string[]; description: string; budget_range: string | null }): number {
  const cat    = scoreCategories(a.categories, b.categories);
  const text   = scoreText(a.description, b.description);
  const budget = a.budget_range && b.budget_range && a.budget_range === b.budget_range ? 10 : 0;
  return Math.min(cat + text + budget, 100);
}

function buildReasons(a: { categories: string[]; budget_range: string | null },
                      b: { categories: string[]; budget_range: string | null }): string[] {
  const reasons: string[] = [];
  const shared = a.categories.filter(c =>
    b.categories.some(d => c.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(c.toLowerCase())),
  );
  if (shared.length) reasons.push(`Categorías: ${shared.join(', ')}`);
  if (a.budget_range && a.budget_range === b.budget_range) reasons.push(`Ticket: ${a.budget_range}`);
  if (!reasons.length) reasons.push('Palabras clave en descripción coincidentes');
  return reasons;
}

// ─── GET — read persisted matches ───────────────────────────────────────────

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('access_level')
    .eq('id', user.id)
    .single();

  const userLevel = profile?.access_level ?? 1;

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      a:profiles!matches_user_id_a_fkey(id, full_name, company_name, sector, access_level),
      b:profiles!matches_user_id_b_fkey(id, full_name, company_name, sector, access_level)
    `)
    .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
    .eq('status', 'pending')
    .order('score', { ascending: false });

  const result = (matches ?? []).map(m => {
    const isLocked = (m.requires_level ?? 1) > userLevel;
    const other = m.user_id_a === user.id ? m.b : m.a;

    if (isLocked) {
      return {
        id: m.id,
        score: m.score,
        requires_level: m.requires_level,
        score_reasons: [],
        is_locked: true,
        other: { full_name: '███ ███████', company_name: '██████', sector: '██████' },
      };
    }

    return {
      id: m.id,
      score: m.score,
      requires_level: m.requires_level,
      score_reasons: m.score_reasons,
      is_locked: false,
      other,
    };
  });

  return NextResponse.json(result);
}

// ─── POST — recalculate synergy-based matches for the current user ───────────

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // My active synergies (both types)
  const { data: mySynergies } = await supabase
    .from('synergies')
    .select('id, type, description, categories, budget_range')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (!mySynergies?.length) return NextResponse.json({ inserted: 0 });

  // All other users' active synergies + their access_level
  const { data: otherSynergies } = await supabase
    .from('synergies')
    .select('id, user_id, type, description, categories, budget_range, profiles(access_level)')
    .eq('is_active', true)
    .neq('user_id', user.id);

  if (!otherSynergies?.length) return NextResponse.json({ inserted: 0 });

  // Build best-score match per other-user (busco↔ofrezco pairs only)
  type MatchEntry = {
    user_id_a: string; user_id_b: string;
    synergy_id_a: string; synergy_id_b: string;
    score: number; score_reasons: string[]; requires_level: number;
  };
  const bestPerUser = new Map<string, MatchEntry>();

  for (const mine of mySynergies) {
    for (const theirs of otherSynergies) {
      // Only cross-type pairs
      if (mine.type === theirs.type) continue;

      const score = calcScore(
        { categories: mine.categories ?? [], description: mine.description, budget_range: mine.budget_range ?? null },
        { categories: theirs.categories ?? [], description: theirs.description, budget_range: theirs.budget_range ?? null },
      );
      if (score < 20) continue;

      const existing = bestPerUser.get(theirs.user_id);
      if (existing && existing.score >= score) continue;

      const [uid_a, uid_b] = [user.id, theirs.user_id].sort();
      const synA = uid_a === user.id ? mine.id : theirs.id;
      const synB = uid_b === user.id ? mine.id : theirs.id;
      const otherProfile = (theirs as any).profiles;
      const requiresLevel: number = otherProfile?.access_level ?? 1;

      bestPerUser.set(theirs.user_id, {
        user_id_a: uid_a,
        user_id_b: uid_b,
        synergy_id_a: synA,
        synergy_id_b: synB,
        score,
        score_reasons: buildReasons(
          { categories: mine.categories ?? [], budget_range: mine.budget_range ?? null },
          { categories: theirs.categories ?? [], budget_range: theirs.budget_range ?? null },
        ),
        requires_level: requiresLevel,
      });
    }
  }

  if (!bestPerUser.size) return NextResponse.json({ inserted: 0 });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();

  const rows = Array.from(bestPerUser.values()).map(m => ({
    ...m,
    status: 'pending',
    generated_at: now.toISOString(),
    expires_at: expiresAt,
  }));

  const { error } = await supabase
    .from('matches')
    .upsert(rows, { onConflict: 'user_id_a,user_id_b' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update match_count on my synergies that participated
  const synergyIds = rows.map(r =>
    r.user_id_a === user.id ? r.synergy_id_a : r.synergy_id_b,
  );
  const countBySynergy = synergyIds.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
  await Promise.all(
    Object.entries(countBySynergy).map(([id, count]) =>
      supabase.from('synergies').update({ match_count: count }).eq('id', id),
    ),
  );

  return NextResponse.json({ inserted: rows.length });
}
