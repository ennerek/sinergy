'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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

  const publish = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const supabase = createClient();
    await supabase.from('reflections').insert({ user_id: currentUserId, content: text });
    const { data } = await supabase
      .from('reflections')
      .select('*, profiles(full_name, sector), reflection_replies(id)')
      .order('created_at', { ascending: false })
      .limit(20);
    setLocalReflections(data ?? []);
    setText('');
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

        {/* Post reflection */}
        <div className="thread-composer">
          <textarea
            placeholder="Comparte un aprendizaje, dilema o reflexión con la red..."
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={500}
            style={{ width: '100%', border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink)', minHeight: 64, lineHeight: 1.5 }}
          />
          <button className="post-btn" onClick={publish} disabled={sending || !text.trim()}>
            {sending ? 'Publicando...' : 'Publicar reflexión'}
          </button>
        </div>

        {/* Reflections list */}
        <div className="slbl">Reflexiones de la red</div>
        {localReflections.map(r => {
          const initials = (r.profiles?.full_name || 'A').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase();
          const firstName = r.profiles?.full_name?.split(' ')[0] || 'Anónimo';
          const daysAgo = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
          return (
            <div key={r.id} className="thread">
              <div className="thread-hd">
                <div className="thread-av">{initials}</div>
                <div>
                  <div className="thread-name">{firstName} · <em style={{ fontStyle: 'normal', color: 'var(--mut)' }}>{r.profiles?.sector || 'Empresario'}</em></div>
                  <div className="thread-meta">hace {daysAgo === 0 ? 'hoy' : `${daysAgo} día${daysAgo !== 1 ? 's' : ''}`}</div>
                </div>
              </div>
              <div className="thread-body">{r.content}</div>
              {r.reflection_replies?.length > 0 && (
                <div className="thread-foot">{r.reflection_replies.length} respuesta{r.reflection_replies.length !== 1 ? 's' : ''}</div>
              )}
            </div>
          );
        })}

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
