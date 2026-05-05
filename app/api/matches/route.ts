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
  wA.forEach(w => { if (wB.has(w)) overlap++; });
  if (overlap === 0) return 0;
  // Use overlap / min(|A|, |B|) — rewards descriptions sharing even a few keywords
  const minSize = Math.min(wA.size, wB.size);
  return Math.round((overlap / minSize) * 40);
}

function calcScore(a: { categories: string[]; description: string; budget_range: string | null },
                   b: { categories: string[]; description: string; budget_range: string | null }): number {
  const cat    = scoreCategories(a.categories, b.categories);
  const text   = scoreText(a.description, b.description);
  const budget = a.budget_range && b.budget_range && a.budget_range === b.budget_range ? 10 : 0;
  return Math.min(cat + text + budget, 100);
}

function buildReasons(a: { categories: string[]; budget_range: string | null; description: string },
                      b: { categories: string[]; budget_range: string | null; description: string }): string[] {
  const reasons: string[] = [];
  const shared = a.categories.filter(c =>
    b.categories.some(d => c.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(c.toLowerCase())),
  );
  if (shared.length) reasons.push(`Categorías: ${shared.join(', ')}`);
  if (a.budget_range && a.budget_range === b.budget_range) reasons.push(`Ticket: ${a.budget_range}`);
  // Show actual overlapping keywords from descriptions
  const wA = tokenize(a.description);
  const wB = tokenize(b.description);
  const sharedWords: string[] = [];
  wA.forEach(w => { if (wB.has(w)) sharedWords.push(w); });
  if (sharedWords.length > 0) reasons.push(`Palabras clave: ${sharedWords.slice(0, 5).join(', ')}`);
  if (!reasons.length) reasons.push('Descripción con coincidencias potenciales');
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

// ─── POST — recalculate AI-enriched matches for the current user ─────────────
// Uses both synergy posts AND profile synergy_interests / offerings fields.
// Guarantees no self-matching (neq user.id on every query).

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ── Fetch current user's profile + synergies ──────────────────────────────
  const [profileRes, mySynergiesRes] = await Promise.all([
    supabase.from('profiles').select('synergy_interests, offerings, access_level').eq('id', user.id).single(),
    supabase.from('synergies').select('id, type, description, categories, budget_range').eq('user_id', user.id).eq('is_active', true),
  ]);

  const myProfile = profileRes.data;
  const mySynergies = mySynergiesRes.data ?? [];
  const myInterests: string[] = myProfile?.synergy_interests ?? [];
  const myOfferings: string[] = myProfile?.offerings ?? [];

  // ── Fetch all OTHER users (never self) ────────────────────────────────────
  const [otherSynergiesRes, otherProfilesRes] = await Promise.all([
    supabase.from('synergies').select('id, user_id, type, description, categories, budget_range').eq('is_active', true).neq('user_id', user.id),
    supabase.from('profiles').select('id, full_name, company_name, synergy_interests, offerings, access_level').neq('id', user.id),
  ]);

  const otherSynergies = otherSynergiesRes.data ?? [];
  const otherProfiles = otherProfilesRes.data ?? [];
  const otherProfileMap = new Map(otherProfiles.map(p => [p.id, p]));

  // Group other synergies by user
  const synByUser = new Map<string, typeof otherSynergies>();
  for (const s of otherSynergies) {
    if (!synByUser.has(s.user_id)) synByUser.set(s.user_id, []);
    synByUser.get(s.user_id)!.push(s);
  }

  type MatchEntry = {
    user_id_a: string; user_id_b: string;
    synergy_id_a: string | null; synergy_id_b: string | null;
    score: number; score_reasons: string[]; requires_level: number;
  };
  const bestPerUser = new Map<string, MatchEntry>();

  const tryUpdate = (otherId: string, entry: MatchEntry) => {
    const existing = bestPerUser.get(otherId);
    if (!existing || existing.score < entry.score) bestPerUser.set(otherId, entry);
  };

  // ── 1. Synergy post cross-matching (busco ↔ ofrezco) ─────────────────────
  for (const mine of mySynergies) {
    for (const theirs of otherSynergies) {
      if (mine.type === theirs.type) continue; // must be cross-type
      const score = calcScore(
        { categories: mine.categories ?? [], description: mine.description, budget_range: mine.budget_range ?? null },
        { categories: theirs.categories ?? [], description: theirs.description, budget_range: theirs.budget_range ?? null },
      );
      if (score < 10) continue;
      const [uid_a, uid_b] = [user.id, theirs.user_id].sort();
      const synA = uid_a === user.id ? mine.id : theirs.id;
      const synB = uid_b === user.id ? mine.id : theirs.id;
      const requiresLevel = otherProfileMap.get(theirs.user_id)?.access_level ?? 1;
      tryUpdate(theirs.user_id, {
        user_id_a: uid_a, user_id_b: uid_b, synergy_id_a: synA, synergy_id_b: synB,
        score,
        score_reasons: buildReasons(
          { categories: mine.categories ?? [], budget_range: mine.budget_range ?? null, description: mine.description ?? '' },
          { categories: theirs.categories ?? [], budget_range: theirs.budget_range ?? null, description: theirs.description ?? '' },
        ),
        requires_level: requiresLevel,
      });
    }
  }

  // ── 2. Profile fields ↔ other's synergy posts ─────────────────────────────
  if (myInterests.length > 0 || myOfferings.length > 0) {
    for (const theirs of otherSynergies) {
      let score = 0;
      const reasons: string[] = [];
      if (theirs.type === 'ofrezco' && myInterests.length > 0) {
        const s = scoreCategories(myInterests, theirs.categories ?? []) + scoreText(myInterests.join(' '), theirs.description);
        if (s >= 10) { score = Math.max(score, s); reasons.push(`Busco: ${myInterests.slice(0, 3).join(', ')}`); }
      }
      if (theirs.type === 'busco' && myOfferings.length > 0) {
        const s = scoreCategories(myOfferings, theirs.categories ?? []) + scoreText(myOfferings.join(' '), theirs.description);
        if (s >= 10) { score = Math.max(score, s); reasons.push(`Ofrezco: ${myOfferings.slice(0, 3).join(', ')}`); }
      }
      if (score < 10) continue;
      const relatedMine = mySynergies.find(m =>
        (theirs.type === 'ofrezco' && m.type === 'busco') || (theirs.type === 'busco' && m.type === 'ofrezco'),
      );
      const [uid_a, uid_b] = [user.id, theirs.user_id].sort();
      const synA = uid_a === user.id ? (relatedMine?.id ?? null) : theirs.id;
      const synB = uid_b === user.id ? (relatedMine?.id ?? null) : theirs.id;
      const requiresLevel = otherProfileMap.get(theirs.user_id)?.access_level ?? 1;
      tryUpdate(theirs.user_id, {
        user_id_a: uid_a, user_id_b: uid_b, synergy_id_a: synA, synergy_id_b: synB,
        score, score_reasons: reasons, requires_level: requiresLevel,
      });
    }
  }

  // ── 3. Profile-to-profile matching ────────────────────────────────────────
  for (const op of otherProfiles) {
    const theirInterests: string[] = op.synergy_interests ?? [];
    const theirOfferings: string[] = op.offerings ?? [];
    const s1 = myInterests.length && theirOfferings.length ? scoreCategories(myInterests, theirOfferings) : 0;
    const s2 = myOfferings.length && theirInterests.length ? scoreCategories(myOfferings, theirInterests) : 0;
    const score = Math.min(s1 + s2, 100);
    if (score < 10) continue;
    const reasons: string[] = [];
    if (s1 > 0) reasons.push('Ofrecen lo que busco');
    if (s2 > 0) reasons.push('Buscan lo que ofrezco');
    const theirSyns = synByUser.get(op.id) ?? [];
    const bestMine = mySynergies.find(s => s.type === (s1 > s2 ? 'busco' : 'ofrezco')) ?? mySynergies[0];
    const bestTheirs = theirSyns.find(s => s.type === (s1 > s2 ? 'ofrezco' : 'busco')) ?? theirSyns[0];
    const [uid_a, uid_b] = [user.id, op.id].sort();
    const synA = uid_a === user.id ? (bestMine?.id ?? null) : (bestTheirs?.id ?? null);
    const synB = uid_b === user.id ? (bestMine?.id ?? null) : (bestTheirs?.id ?? null);
    tryUpdate(op.id, {
      user_id_a: uid_a, user_id_b: uid_b, synergy_id_a: synA, synergy_id_b: synB,
      score, score_reasons: reasons, requires_level: op.access_level ?? 1,
    });
  }

  if (!bestPerUser.size) return NextResponse.json({ inserted: 0 });

  // ── 4. AI enrichment (single batch call) ──────────────────────────────────
  const sortedCandidates = Array.from(bestPerUser.entries()).sort((a, b) => b[1].score - a[1].score).slice(0, 15);

  try {
    if (process.env.ANTHROPIC_API_KEY && sortedCandidates.length > 0) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const myBuscoText = mySynergies.filter(s => s.type === 'busco').map(s => s.description).join('; ');
      const myOfrezcoText = mySynergies.filter(s => s.type === 'ofrezco').map(s => s.description).join('; ');

      const candidatesSummary = sortedCandidates.map(([uid], idx) => {
        const prof = otherProfileMap.get(uid);
        const syns = synByUser.get(uid) ?? [];
        return {
          idx,
          intereses: prof?.synergy_interests ?? [],
          ofertas: prof?.offerings ?? [],
          busco_posts: syns.filter(s => s.type === 'busco').map(s => s.description),
          ofrezco_posts: syns.filter(s => s.type === 'ofrezco').map(s => s.description),
        };
      });

      const prompt = `Eres un motor de matching B2B para una red empresarial.
Puntúa la compatibilidad del USUARIO con cada CANDIDATO (1-100) y escribe una razón en español (máx. 12 palabras).

USUARIO:
- Busca (intereses): ${myInterests.join(', ') || '—'}
- Ofrece (perfil): ${myOfferings.join(', ') || '—'}
- Posts busco: ${myBuscoText || '—'}
- Posts ofrezco: ${myOfrezcoText || '—'}

CANDIDATOS:
${JSON.stringify(candidatesSummary)}

Responde SOLO con JSON válido: [{"idx":0,"ai_score":85,"reason":"razón concisa"}]`;

      const resp = await anthropic.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = resp.content[0].type === 'text' ? resp.content[0].text.trim() : '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const aiResults: Array<{ idx: number; ai_score: number; reason: string }> = JSON.parse(jsonMatch[0]);
        for (const r of aiResults) {
          const entry = sortedCandidates[r.idx];
          if (!entry) continue;
          const [, match] = entry;
          // Blend: 60% AI score + 40% keyword score
          match.score = Math.min(Math.round(r.ai_score * 0.6 + match.score * 0.4), 100);
          match.score_reasons = [r.reason, ...match.score_reasons.slice(0, 2)];
        }
      }
    }
  } catch (_) {
    // AI enrichment failed — fall back to keyword scores silently
  }

  // ── 5. Persist ────────────────────────────────────────────────────────────
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
  const rows = Array.from(bestPerUser.values()).map(m => ({
    ...m,
    status: 'pending',
    generated_at: now.toISOString(),
    expires_at: expiresAt,
  }));

  const { error } = await supabase.from('matches').upsert(rows, { onConflict: 'user_id_a,user_id_b' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update match_count on anchoring synergies
  const synergyIds = rows
    .map(r => r.user_id_a === user.id ? r.synergy_id_a : r.synergy_id_b)
    .filter(Boolean) as string[];
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

// ─── PATCH — global recalculation: recalculate every user's matches ──────────
// Called after any user publishes a new synergy so both sides see matches.

export async function PATCH() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Load ALL active synergies for all users
  const { data: allSynergies } = await supabase
    .from('synergies')
    .select('id, user_id, type, description, categories, budget_range, profiles(access_level)')
    .eq('is_active', true);

  if (!allSynergies?.length) return NextResponse.json({ inserted: 0 });

  type MatchEntry = {
    user_id_a: string; user_id_b: string;
    synergy_id_a: string; synergy_id_b: string;
    score: number; score_reasons: string[]; requires_level: number;
  };
  const bestPerPair = new Map<string, MatchEntry>();

  for (let i = 0; i < allSynergies.length; i++) {
    for (let j = i + 1; j < allSynergies.length; j++) {
      const s1 = allSynergies[i];
      const s2 = allSynergies[j];
      if (s1.user_id === s2.user_id) continue;
      // Only cross-type (busco↔ofrezco)
      if (s1.type === s2.type) continue;

      const score = calcScore(
        { categories: s1.categories ?? [], description: s1.description, budget_range: s1.budget_range ?? null },
        { categories: s2.categories ?? [], description: s2.description, budget_range: s2.budget_range ?? null },
      );
      if (score < 10) continue;

      const [uid_a, uid_b] = [s1.user_id, s2.user_id].sort();
      const pairKey = `${uid_a}|${uid_b}`;
      const existing = bestPerPair.get(pairKey);
      if (existing && existing.score >= score) continue;

      const synA = uid_a === s1.user_id ? s1.id : s2.id;
      const synB = uid_b === s1.user_id ? s1.id : s2.id;
      const profA = (uid_a === s1.user_id ? (s1 as any) : (s2 as any)).profiles;
      const profB = (uid_b === s1.user_id ? (s1 as any) : (s2 as any)).profiles;
      const requiresLevel: number = Math.max(profA?.access_level ?? 1, profB?.access_level ?? 1);

      bestPerPair.set(pairKey, {
        user_id_a: uid_a,
        user_id_b: uid_b,
        synergy_id_a: synA,
        synergy_id_b: synB,
        score,
        score_reasons: buildReasons(
          { categories: s1.categories ?? [], budget_range: s1.budget_range ?? null, description: s1.description ?? '' },
          { categories: s2.categories ?? [], budget_range: s2.budget_range ?? null, description: s2.description ?? '' },
        ),
        requires_level: requiresLevel,
      });
    }
  }

  if (!bestPerPair.size) return NextResponse.json({ inserted: 0 });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
  const rows = Array.from(bestPerPair.values()).map(m => ({
    ...m,
    status: 'pending',
    generated_at: now.toISOString(),
    expires_at: expiresAt,
  }));

  const { error } = await supabase
    .from('matches')
    .upsert(rows, { onConflict: 'user_id_a,user_id_b' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inserted: rows.length });
}
