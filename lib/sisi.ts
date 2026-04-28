import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface SisiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askSisi(
  userMessage: string,
  history: SisiMessage[]
): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [profileRes, synergiesRes, matchesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('synergies').select('*').eq('user_id', user.id).eq('is_active', true).limit(5),
    supabase
      .from('matches')
      .select('*, profiles!matches_user_id_b_fkey(full_name, company_name, sector)')
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .order('score', { ascending: false })
      .limit(3),
  ]);

  const profile = profileRes.data;
  const synergies = synergiesRes.data ?? [];
  const matches = matchesRes.data ?? [];

  const systemPrompt = `Eres SISI, asistente de sinergias empresariales de Makers Synergy Charity.

PERFIL DEL USUARIO:
- Nombre: ${profile?.full_name ?? 'usuario'}
- Empresa: ${profile?.company_name ?? 'no especificada'}
- Sector: ${profile?.sector ?? 'no especificado'}
- Nivel de acceso: ${profile?.access_level ?? 1}
- Intereses: ${(profile?.synergy_interests ?? []).join(', ')}
- Ofrece: ${(profile?.offerings ?? []).join(', ')}

BUSCOS/OFREZCOS ACTIVOS:
${synergies.map(s => `- [${s.type.toUpperCase()}] ${s.description}`).join('\n') || 'Ninguno aún'}

TOP MATCHES PENDIENTES:
${matches.slice(0, 3).map(m => `- Score ${m.score}: ${(m as any).profiles?.full_name ?? 'Anónimo'} (${(m as any).profiles?.sector ?? ''})`).join('\n') || 'Calculando...'}

INSTRUCCIONES:
- Respuestas cortas y directas (máx. 3 párrafos)
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
    { user_id: user.id, role: 'user', content: userMessage },
    { user_id: user.id, role: 'assistant', content: reply },
  ]);

  return reply;
}
