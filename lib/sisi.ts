import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export interface SisiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ComputedMatch {
  profile: { id: string; full_name: string | null; company_name: string | null; sector: string | null };
  score: number;
  theyOfferWhatINeed: string[];
  theyNeedWhatIOffer: string[];
}

function intersect(a: string[], b: string[]): string[] {
  return a.filter(x => b.includes(x));
}

function computeMatches(
  myInterests: string[],
  myOfferings: string[],
  others: { id: string; full_name: string | null; company_name: string | null; sector: string | null; synergy_interests: string[] | null; offerings: string[] | null }[]
): ComputedMatch[] {
  return others
    .map(other => {
      const theyOfferWhatINeed = intersect(other.offerings ?? [], myInterests);
      const theyNeedWhatIOffer = intersect(other.synergy_interests ?? [], myOfferings);
      return { profile: other, score: theyOfferWhatINeed.length + theyNeedWhatIOffer.length, theyOfferWhatINeed, theyNeedWhatIOffer };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score);
}

export async function askSisi(
  userId: string,
  userMessage: string,
  history: SisiMessage[] = []
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is missing');
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = createClient();

  const [profileRes, synergiesRes, othersRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('synergies').select('*').eq('user_id', userId).eq('is_active', true).limit(5),
    supabase
      .from('profiles')
      .select('id, full_name, company_name, sector, synergy_interests, offerings')
      .neq('id', userId),
  ]);

  const profile = profileRes.data;
  const synergies = synergiesRes.data ?? [];
  const others = othersRes.data ?? [];

  const myInterests: string[] = profile?.synergy_interests ?? [];
  const myOfferings: string[] = profile?.offerings ?? [];
  const matches = computeMatches(myInterests, myOfferings, others);

  const matchesSummary = matches.length === 0
    ? 'No hay matches todavía. El usuario aún no tiene intereses u ofertas configurados, o nadie en la red complementa su perfil.'
    : matches.slice(0, 5).map((m, i) => {
        const parts: string[] = [];
        if (m.theyOfferWhatINeed.length > 0)
          parts.push(`ofrece lo que yo busco: ${m.theyOfferWhatINeed.join(', ')}`);
        if (m.theyNeedWhatIOffer.length > 0)
          parts.push(`busca lo que yo ofrezco: ${m.theyNeedWhatIOffer.join(', ')}`);
        return `${i + 1}. ${m.profile.full_name ?? 'Anónimo'} (${m.profile.company_name ?? m.profile.sector ?? 'sin datos'}) — Score ${m.score}/10 — ${parts.join(' · ')}`;
      }).join('\n');

  const systemPrompt = `Eres SISI, asistente de sinergias empresariales de Makers Synergy Charity.

PERFIL DEL USUARIO:
- Nombre: ${profile?.full_name ?? 'usuario'}
- Empresa: ${profile?.company_name ?? 'no especificada'}
- Sector: ${profile?.sector ?? 'no especificado'}
- Nivel de acceso: ${profile?.access_level ?? 1}
- Busco sinergias en: ${myInterests.length > 0 ? myInterests.join(', ') : 'no especificado'}
- Puedo ofrecer: ${myOfferings.length > 0 ? myOfferings.join(', ') : 'no especificado'}

BUSCOS/OFREZCOS ACTIVOS:
${synergies.map(s => `- [${s.type.toUpperCase()}] ${s.description}`).join('\n') || 'Ninguno aún'}

MATCHES CALCULADOS (${matches.length} en total):
${matchesSummary}

INSTRUCCIONES:
- Respuestas cortas y directas (máx. 3 párrafos)
- Cuando el usuario pregunte por matches, explica cuántos hay y describe los mejores con nombres reales
- Si no hay matches, explica que debe completar sus intereses y ofertas en el perfil
- Ayuda a priorizar conexiones, preparar presentaciones de sinergia y dar consejos concretos
- Usa el contexto real del perfil para hacer sugerencias específicas
- Idioma: español`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    system: systemPrompt,
    messages: [
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: userMessage },
    ],
  });

  const reply = response.content[0].type === 'text' ? response.content[0].text : '';

  // Persist in DB
  await supabase.from('sisi_messages').insert([
    { user_id: userId, role: 'user', content: userMessage },
    { user_id: userId, role: 'assistant', content: reply },
  ]);

  return reply;
}
