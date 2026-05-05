'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ContactOverlay from '@/components/overlays/ContactOverlay';

const CATEGORIES_BUSCO = ['Servicios', 'Inversión', 'Clientes', 'Talento', 'Espacios'];
const CATEGORIES_OFREZCO = ['Tecnología', 'Red contactos', 'Expertise', 'Espacio', 'Inversión'];
const BUDGETS = ['< 10k', '10–50k', '50–200k', '200k–1M', '1M+'];

export default function SinergiasPage() {
  const [tab, setTab] = useState<'busco' | 'ofrezco'>('busco');
  const [text, setText] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [synergies, setSynergies] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contactTarget, setContactTarget] = useState<any>(null);
  const [matchContactTarget, setMatchContactTarget] = useState<any>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const supabase = createClient();
    const [{ data: { user } }, { data }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from('synergies')
        .select('*, profiles(full_name, company_name, sector, avatar_url)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ]);
    setUserId(user?.id ?? null);
    setSynergies(data ?? []);
    // Load persisted matches
    try {
      const res = await fetch('/api/matches');
      if (res.ok) setMatches(await res.json());
    } catch (_) { /* ignore */ }
  };

  const toggleCat = (c: string) => setCats(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const publish = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('synergies').insert({ user_id: user.id, type: tab, description: text, categories: cats, budget_range: budget });
    // AI-enriched recalculation for current user (also triggers global via PATCH)
    await Promise.all([
      fetch('/api/matches', { method: 'POST' }),
      fetch('/api/matches', { method: 'PATCH' }),
    ]);
    setText(''); setCats([]); setBudget('');
    await loadAll();
    setLoading(false);
  };

  const byTab = synergies.filter(s => s.type === tab);
  const mine = byTab.filter(s => s.user_id === userId);
  const others = byTab.filter(s => s.user_id !== userId);

  const CATS = tab === 'busco' ? CATEGORIES_BUSCO : CATEGORIES_OFREZCO;
  const isOffer = tab === 'ofrezco';

  const SynergyCard = ({ s, isOwn }: { s: any; isOwn: boolean }) => {
    const profile = s.profiles;
    const name = profile?.full_name || 'Usuario';
    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div className="post-item">
        {!isOwn && (
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: isOffer ? 'rgba(184,146,46,.15)' : 'rgba(26,71,49,.1)',
            border: `1px solid ${isOffer ? 'rgba(184,146,46,.25)' : 'rgba(26,71,49,.15)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: isOffer ? '#A07820' : 'var(--tl)',
          }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
              : initials
            }
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!isOwn && (
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sft)', marginBottom: 3 }}>
              {name}{profile?.company_name ? <span style={{ fontWeight: 400, color: 'var(--mut)' }}> · {profile.company_name}</span> : null}
            </div>
          )}
          <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{s.description}</div>
          <div className="post-mini">
            {s.categories?.length > 0 && <span>{(s.categories as string[]).join(', ')}</span>}
            {s.budget_range && <span>{s.budget_range}</span>}
            {isOwn && <span><b>{s.match_count}</b> matches</span>}
            <span>{new Date(s.created_at).toLocaleDateString('es-ES')}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="sc on" id="sc-sinergias" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Tabs */}
      <div className="bo-tabs">
        <button className={`bo-tab${tab === 'busco' ? ' on' : ''}`} onClick={() => setTab('busco')}>🔍 Busco</button>
        <button className={`bo-tab${tab === 'ofrezco' ? ' on' : ''}`} onClick={() => setTab('ofrezco')}>💡 Ofrezco</button>
      </div>

      {/* Header */}
      <div className={`bo-header${isOffer ? ' offer' : ''}`} style={isOffer ? { background: 'var(--gd)', margin: '0 16px 13px' } : {}}>
        <div className="bo-h-label">{isOffer ? 'LO QUE OFREZCO' : 'LO QUE BUSCO'}</div>
        <div className="bo-h-title">{isOffer ? 'Mi propuesta de valor' : 'Lo que busco'}</div>
        <div className="bo-h-sub">{isOffer ? 'Comparte lo que puedes aportar a la red.' : 'Describe qué necesitas y SISI buscará el match perfecto.'}</div>
      </div>

      {/* Form */}
      <div className="pad" style={{ paddingBottom: 0 }}>
        <div className="post-input">
          <textarea
            placeholder={isOffer ? 'Ofrezco dashboards de IA vertical...' : 'Busco agencia de eventos para lanzamiento...'}
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={400}
          />
        </div>

        <div className="slbl">Categoría</div>
        <div className="post-chips">
          {CATS.map(c => (
            <button key={c} className={`post-chip${cats.includes(c) ? ' on' : ''}`} onClick={() => toggleCat(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="slbl">Rango de ticket</div>
        <div className="post-chips">
          {BUDGETS.map(b => (
            <button key={b} className={`post-chip${budget === b ? ' on' : ''}`} onClick={() => setBudget(b === budget ? '' : b)}>
              {b}
            </button>
          ))}
        </div>

        <button
          className={`post-btn${isOffer ? ' gold' : ''}`}
          onClick={publish}
          disabled={loading || !text.trim()}
        >
          {loading ? 'Publicando...' : `Publicar ${tab} ✦`}
        </button>

        {/* My synergies */}
        <div className="slbl">Mis {tab === 'busco' ? 'búsquedas' : 'ofertas'} activas</div>
        {mine.map(s => <SynergyCard key={s.id} s={s} isOwn />)}
        {mine.length === 0 && (
          <div style={{ padding: '12px 0 4px', color: 'var(--mut)', fontSize: 13, textAlign: 'center' }}>
            Aún no tienes {tab === 'busco' ? 'búsquedas' : 'ofertas'} activas.
          </div>
        )}

        {/* Others' synergies */}
        <div className="slbl" style={{ marginTop: 18 }}>
          {tab === 'busco' ? 'Lo que busca la red' : 'Lo que ofrece la red'}
        </div>
        {others.map(s => <SynergyCard key={s.id} s={s} isOwn={false} />)}
        {others.length === 0 && (
          <div style={{ padding: '12px 0 4px', color: 'var(--mut)', fontSize: 13, textAlign: 'center' }}>
            Ningún otro miembro ha publicado {tab === 'busco' ? 'búsquedas' : 'ofertas'} aún.
          </div>
        )}

        {/* ── Matches IA ──────────────────────────────────────────────── */}
        {matches.length > 0 && (
          <>
            <div className="slbl" style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 6 }}>
              Matches sugeridos por IA
              <span style={{ background: 'var(--tl)', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 7px' }}>
                {matches.length}
              </span>
            </div>
            {matches.map(m => {
              const other = m.other;
              const name = other?.full_name || 'Usuario';
              const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const score: number = m.score ?? 0;
              const scoreColor = score >= 70 ? '#1A4731' : score >= 40 ? '#B8922E' : '#999';
              return (
                <div key={m.id} style={{
                  background: 'var(--white)', border: '1px solid var(--bdr)', borderRadius: 14,
                  padding: '12px 14px', marginBottom: 8,
                }}>
                  {m.is_locked ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔒</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>███ ███████</div>
                        <div style={{ fontSize: 11, color: 'var(--mut)' }}>Nivel {m.requires_level} requerido</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#ccc' }}>{score}%</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, background: 'rgba(26,71,49,.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: 'var(--tl)', flexShrink: 0,
                        }}>{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{name}</div>
                          <div style={{ fontSize: 11, color: 'var(--mut)' }}>{other?.company_name || other?.sector || 'Empresario'}</div>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: scoreColor, flexShrink: 0 }}>{score}%</div>
                      </div>
                      {m.score_reasons?.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--tl)', background: 'rgba(26,71,49,.06)', borderRadius: 8, padding: '6px 10px', marginBottom: 8, lineHeight: 1.5 }}>
                          ✦ {(m.score_reasons as string[]).slice(0, 2).join(' · ')}
                        </div>
                      )}
                      <button
                        onClick={() => setMatchContactTarget(other)}
                        style={{ width: '100%', background: 'var(--tl)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Contactar →
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>

    {matchContactTarget && (
      <ContactOverlay open={!!matchContactTarget} onClose={() => setMatchContactTarget(null)} target={matchContactTarget} />
    )}
    {contactTarget && (
      <ContactOverlay open={!!contactTarget} onClose={() => setContactTarget(null)} target={contactTarget} />
    )}
    </>
  );
}
