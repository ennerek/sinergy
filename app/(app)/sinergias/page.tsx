'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES_BUSCO = ['Servicios', 'Inversión', 'Clientes', 'Talento', 'Espacios'];
const CATEGORIES_OFREZCO = ['Tecnología', 'Red contactos', 'Expertise', 'Espacio', 'Inversión'];
const BUDGETS = ['< 10k', '10–50k', '50–200k', '200k–1M', '1M+'];

export default function SinergiasPage() {
  const [tab, setTab] = useState<'busco' | 'ofrezco'>('busco');
  const [text, setText] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [synergies, setSynergies] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
  };

  const toggleCat = (c: string) => setCats(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const publish = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('synergies').insert({ user_id: user.id, type: tab, description: text, categories: cats, budget_range: budget });
    // Recalculate synergy-based matches for this user
    await fetch('/api/matches', { method: 'POST' });
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

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
