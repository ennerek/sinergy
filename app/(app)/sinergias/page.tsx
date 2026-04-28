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
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadSynergies(); }, []);

  const loadSynergies = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('synergies').select('*').eq('is_active', true).order('created_at', { ascending: false });
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
    setText(''); setCats([]); setBudget('');
    await loadSynergies();
    setLoading(false);
  };

  const mine = synergies.filter(s => s.type === tab);

  const CATS = tab === 'busco' ? CATEGORIES_BUSCO : CATEGORIES_OFREZCO;
  const isOffer = tab === 'ofrezco';

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

        {/* Active list */}
        <div className="slbl">Tus {tab === 'busco' ? 'buscos' : 'ofrezcos'} activos</div>
        {mine.map(s => (
          <div key={s.id} className="post-item">
            <div style={{ flex: 1 }}>
              <b>{s.description}</b>
              <div className="post-mini">
                <span><b>{s.match_count}</b> matches</span>
                <span>{new Date(s.created_at).toLocaleDateString('es-ES')}</span>
                {s.budget_range && <span>{s.budget_range}</span>}
              </div>
            </div>
          </div>
        ))}
        {mine.length === 0 && (
          <div style={{ padding: '16px 0', color: 'var(--mut)', fontSize: 13, textAlign: 'center' }}>
            Aún no tienes {tab === 'busco' ? 'buscos' : 'ofrezcos'} activos.
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
