'use client';

import { useState, useEffect, useCallback } from 'react';
import ChatOverlay from '@/components/overlays/ChatOverlay';

interface Reply {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string; sector?: string };
}

interface Reflection {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_active: boolean;
  profiles?: { full_name?: string; sector?: string; avatar_url?: string };
  reflection_replies?: { id: string }[];
}

interface Props {
  currentUserId: string;
  profile: any;
  reflections: Reflection[];
  mentors: any[];
}

export default function MentoresClient({ currentUserId, profile, reflections, mentors }: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [localReflections, setLocalReflections] = useState<Reflection[]>(reflections);
  const [loadingReflections, setLoadingReflections] = useState(reflections.length === 0);
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Per-card state
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [repliesData, setRepliesData] = useState<Record<string, Reply[]>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const loadReflections = useCallback(async () => {
    try {
      const res = await fetch('/api/reflections');
      if (res.ok) {
        const data = await res.json();
        setLocalReflections(data);
      } else {
        const body = await res.text();
        setErrorMsg(`Error cargando reflexiones: ${res.status} ${body}`);
      }
    } catch (e: any) {
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
      if (!res.ok) {
        const body = await res.text();
        setErrorMsg(`Error al publicar: ${res.status} ${body}`);
        setSending(false);
        return;
      }
    } catch (e: any) {
      setErrorMsg(`Error de red al publicar: ${e?.message ?? e}`);
      setSending(false);
      return;
    }
    setText('');
    await loadReflections();
    setSending(false);
  };

  const deleteReflection = async (id: string) => {
    if (!confirm('¿Eliminar esta reflexión?')) return;
    const res = await fetch(`/api/reflections/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      setLocalReflections(p => p.filter(r => r.id !== id));
    }
  };

  const startEdit = (r: Reflection) => {
    setEditingId(r.id);
    setEditText(r.content);
  };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/reflections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editText }),
    });
    if (res.ok) {
      setLocalReflections(p => p.map(r => r.id === id ? { ...r, content: editText } : r));
      setEditingId(null);
    }
  };

  const toggleSave = async (id: string) => {
    const res = await fetch(`/api/reflections/${id}/save`, { method: 'POST' });
    if (res.ok) {
      const { saved } = await res.json();
      setSavedIds(p => {
        const next = new Set(p);
        saved ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  const toggleReplies = async (id: string) => {
    const willOpen = !openReplies[id];
    setOpenReplies(p => ({ ...p, [id]: willOpen }));
    if (willOpen && !repliesData[id]) {
      const res = await fetch(`/api/reflections/${id}/replies`);
      if (res.ok) {
        const data = await res.json();
        setRepliesData(p => ({ ...p, [id]: data }));
      }
    }
  };

  const submitReply = async (id: string) => {
    const content = replyText[id]?.trim();
    if (!content || sendingReply[id]) return;
    setSendingReply(p => ({ ...p, [id]: true }));
    const res = await fetch(`/api/reflections/${id}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const newReply = await res.json();
      setRepliesData(p => ({ ...p, [id]: [...(p[id] ?? []), newReply] }));
      setReplyText(p => ({ ...p, [id]: '' }));
      setLocalReflections(prev =>
        prev.map(r => r.id === id
          ? { ...r, reflection_replies: [...(r.reflection_replies ?? []), { id: newReply.id }] }
          : r
        )
      );
    }
    setSendingReply(p => ({ ...p, [id]: false }));
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
            const replyCount = r.reflection_replies?.length ?? 0;
            const isSaved = savedIds.has(r.id);
            const repliesOpen = openReplies[r.id];

            return (
              <div key={r.id} className="thread">
                <div className="thread-hd">
                  <div className="thread-av">{initials}</div>
                  <div style={{ flex: 1 }}>
                    <div className="thread-name">
                      {isOwn ? 'Tú' : firstName}
                      {!isOwn && r.profiles?.sector && (
                        <em style={{ fontStyle: 'normal', color: 'var(--mut)' }}> · {r.profiles.sector}</em>
                      )}
                    </div>
                    <div className="thread-meta">{timeStr}</div>
                  </div>
                  {isOwn && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => editingId === r.id ? setEditingId(null) : startEdit(r)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--mut)', padding: '2px 4px' }}
                        title="Editar"
                      >✏️</button>
                      <button
                        onClick={() => deleteReflection(r.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--mut)', padding: '2px 4px' }}
                        title="Eliminar"
                      >🗑️</button>
                    </div>
                  )}
                </div>

                {editingId === r.id ? (
                  <div style={{ marginTop: 6 }}>
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      maxLength={280}
                      style={{ width: '100%', border: '1px solid var(--br)', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: 'none', minHeight: 64, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={() => saveEdit(r.id)} className="post-btn" style={{ flex: 1 }}>Guardar</button>
                      <button onClick={() => setEditingId(null)} style={{ flex: 1, background: 'none', border: '1px solid var(--br)', borderRadius: 20, padding: '6px 0', fontSize: 13, cursor: 'pointer', color: 'var(--mut)' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="thread-body">{r.content}</div>
                )}

                {/* Action bar */}
                <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => toggleReplies(r.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: repliesOpen ? 'var(--accent)' : 'var(--mut)', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
                  >
                    💬 {replyCount > 0 ? replyCount : 'Responder'}
                  </button>
                  <button
                    onClick={() => toggleSave(r.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: isSaved ? 'var(--accent)' : 'var(--mut)', padding: 0 }}
                    title={isSaved ? 'Guardado' : 'Guardar'}
                  >
                    {isSaved ? '🔖 Guardado' : '🔖 Guardar'}
                  </button>
                </div>

                {/* Replies panel */}
                {repliesOpen && (
                  <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid var(--br)' }}>
                    {(repliesData[r.id] ?? []).map(rep => {
                      const repName = rep.profiles?.full_name || 'Anónimo';
                      const repInitials = repName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                      const repDays = Math.floor((Date.now() - new Date(rep.created_at).getTime()) / 86400000);
                      return (
                        <div key={rep.id} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ width: 24, height: 24, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{repInitials}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{rep.user_id === currentUserId ? 'Tú' : repName.split(' ')[0]}</div>
                            <div style={{ fontSize: 11, color: 'var(--mut)' }}>{repDays === 0 ? 'hoy' : `hace ${repDays}d`}</div>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--ink)', marginTop: 2, paddingLeft: 32 }}>{rep.content}</div>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <input
                        type="text"
                        placeholder="Escribe una respuesta..."
                        value={replyText[r.id] ?? ''}
                        onChange={e => setReplyText(p => ({ ...p, [r.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && submitReply(r.id)}
                        maxLength={280}
                        style={{ flex: 1, border: '1px solid var(--br)', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: 'var(--bg)' }}
                      />
                      <button
                        onClick={() => submitReply(r.id)}
                        disabled={!replyText[r.id]?.trim() || sendingReply[r.id]}
                        style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 12, cursor: 'pointer', opacity: (!replyText[r.id]?.trim() || sendingReply[r.id]) ? 0.5 : 1 }}
                      >
                        {sendingReply[r.id] ? '…' : 'Enviar'}
                      </button>
                    </div>
                  </div>
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

  const [chatOpen, setChatOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [localReflections, setLocalReflections] = useState(reflections);
  const [loadingReflections, setLoadingReflections] = useState(reflections.length === 0);
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadReflections = useCallback(async () => {
    try {
      const res = await fetch('/api/reflections');
      if (res.ok) {
        const data = await res.json();
        setLocalReflections(data);
      } else {
        const body = await res.text();
        setErrorMsg(`Error cargando reflexiones: ${res.status} ${body}`);
      }
    } catch (e: any) {
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
      if (!res.ok) {
        const body = await res.text();
        setErrorMsg(`Error al publicar: ${res.status} ${body}`);
        setSending(false);
        return;
      }
    } catch (e: any) {
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
