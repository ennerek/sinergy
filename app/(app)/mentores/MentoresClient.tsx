'use client';

import { useState, useEffect, useCallback } from 'react';
import ChatOverlay from '@/components/overlays/ChatOverlay';

interface Props {
  currentUserId: string;
  profile: any;
  reflections: any[];
  mentors: any[];
}

export default function MentoresClient({ currentUserId, profile, reflections, mentors }: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [localReflections, setLocalReflections] = useState(reflections);
  const [loadingReflections, setLoadingReflections] = useState(reflections.length === 0);
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('—');

  const loadReflections = useCallback(async () => {
    try {
      const res = await fetch('/api/reflections');
      const text = await res.text();
      setDebugInfo(`GET ${res.status}: ${text.slice(0, 300)}`);
      if (res.ok) {
        const data = JSON.parse(text);
        setLocalReflections(data);
      } else {
        setErrorMsg(`Error cargando reflexiones: ${res.status} ${text}`);
      }
    } catch (e: any) {
      setDebugInfo(`Excepción: ${e?.message ?? e}`);
      setErrorMsg(`Error de red: ${e?.message ?? e}`);
    }
    setLoadingReflections(false);
  }, []);

  useEffect(() => { loadReflections(); }, [loadReflections]);

  const publish = async () => {
    if (!text.trim() || sending) return;
    setErrorMsg(null);
    setSending(true);
    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const body = await res.text();
      setDebugInfo(`POST ${res.status}: ${body.slice(0, 300)}`);
      if (!res.ok) {
        setErrorMsg(`Error al publicar: ${res.status} ${body}`);
        setSending(false);
        return;
      }
    } catch (e: any) {
      setDebugInfo(`POST excepción: ${e?.message ?? e}`);
      setErrorMsg(`Error de red al publicar: ${e?.message ?? e}`);
      setSending(false);
      return;
    }
    setText('');
    await loadReflections();
    setSending(false);
  };

  return (
    <div className="sc on" id="sc-mentores" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="pad">
        {/* SISI Mentor Card */}
        <div className="smc" onClick={() => setChatOpen(true)}>
          <div className="smc-av">S</div>
          <div>
            <div className="smc-n">SISI · Asistente IA</div>
            <div className="smc-s">Tu mentora personalizada 24/7</div>
          </div>
          <span className="match-arrow">›</span>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#c00' }}>
            {errorMsg}
          </div>
        )}

        {/* DEBUG: remove after fix */}
        <div style={{ background: '#f0f4ff', border: '1px solid #bcd', borderRadius: 8, padding: '6px 10px', marginBottom: 8, fontSize: 11, color: '#339', wordBreak: 'break-all' }}>
          <strong>DEBUG</strong> · userId: {currentUserId || '⚠️ null'} · reflexiones cargadas: {localReflections.length} · loading: {String(loadingReflections)}<br/>
          <strong>API response:</strong> {debugInfo}
        </div>

        {/* Post reflection */}
        <div className="thread-composer">
          <textarea
            placeholder="Comparte un aprendizaje, dilema o reflexión con la red..."
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={280}
            style={{ width: '100%', border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink)', minHeight: 64, lineHeight: 1.5 }}
          />
          <button className="post-btn" onClick={publish} disabled={sending || !text.trim()}>
            {sending ? 'Publicando...' : 'Publicar reflexión'}
          </button>
        </div>

        {/* Reflections list */}
        <div className="bo-tabs" style={{ marginTop: 8 }}>
          <button className={`bo-tab${tab === 'all' ? ' on' : ''}`} onClick={() => setTab('all')}>🌐 Red</button>
          <button className={`bo-tab${tab === 'mine' ? ' on' : ''}`} onClick={() => setTab('mine')}>✍️ Mis reflexiones</button>
        </div>
        {loadingReflections ? (
          <div style={{ padding: '16px 0', color: 'var(--mut)', fontSize: 13, textAlign: 'center' }}>Cargando reflexiones…</div>
        ) : (() => {
          const visible = tab === 'mine'
            ? localReflections.filter(r => r.user_id === currentUserId)
            : localReflections;
          if (visible.length === 0) {
            return (
              <div style={{ padding: '16px 0', color: 'var(--mut)', fontSize: 13, textAlign: 'center' }}>
                {tab === 'mine' ? 'Aún no has publicado ninguna reflexión.' : 'La red aún no ha publicado reflexiones.'}
              </div>
            );
          }
          return visible.map(r => {
            const initials = (r.profiles?.full_name || 'A').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            const name = r.profiles?.full_name || 'Anónimo';
            const firstName = name.split(' ')[0];
            const isOwn = r.user_id === currentUserId;
            const daysAgo = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
            const timeStr = daysAgo === 0 ? 'hoy' : `hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}`;
            return (
              <div key={r.id} className="thread">
                <div className="thread-hd">
                  <div className="thread-av">{initials}</div>
                  <div>
                    <div className="thread-name">
                      {isOwn ? 'Tú' : firstName}
                      {!isOwn && r.profiles?.sector && (
                        <em style={{ fontStyle: 'normal', color: 'var(--mut)' }}> · {r.profiles.sector}</em>
                      )}
                    </div>
                    <div className="thread-meta">{timeStr}</div>
                  </div>
                </div>
                <div className="thread-body">{r.content}</div>
                {r.reflection_replies?.length > 0 && (
                  <div className="thread-foot">{r.reflection_replies.length} respuesta{r.reflection_replies.length !== 1 ? 's' : ''}</div>
                )}
              </div>
            );
          });
        })()}

        {/* Mentors grid */}
        {mentors.length > 0 && (
          <>
            <div className="slbl" style={{ marginTop: 8 }}>Mentores disponibles</div>
            <div className="mentor-list">
              {mentors.map(m => {
                const initials = (m.full_name || 'M').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase();
                return (
                  <div key={m.id} className="mentor-card">
                    <div className="mc-av">{initials}</div>
                    <div className="mc-name">{m.full_name?.split(' ')[0]}</div>
                    <div className="mc-role">{m.sector || 'Mentor'}</div>
                    <div className="mc-stat">LV{m.access_level}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={{ height: 20 }} />
      </div>

      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} profile={profile} />
    </div>
  );
}
