'use client';

import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  target: any;
  matchId?: string;
}

export default function ContactOverlay({ open, onClose, target, matchId }: Props) {
  const defaultMsg = `Hola ${target?.full_name?.split(' ')[0] || ''},\n\nHe visto que podríamos tener una sinergia interesante. ¿Te parece si lo exploramos con una llamada de 30 minutos?`;
  const [message, setMessage] = useState(defaultMsg);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: target.id, matchId, message }),
      });
      setSent(true);
    } catch {}
    setSending(false);
  };

  if (!open) return null;

  return (
    <div className="overlay contact-overlay">
      <div className="co-drag-handle" />
      {!sent ? (
        <>
          <div className="co-hdr">
            <div style={{ fontWeight: 700, fontSize: 15 }}>Proponer conexión</div>
            <button className="ov-close" onClick={onClose}>✕</button>
          </div>

          <div style={{ padding: '0 16px 8px' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <div className="chat-av">{(target?.full_name || 'A').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{target?.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--mut)' }}>{target?.company_name || target?.sector || 'Empresario'}</div>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: 'var(--mut)', marginBottom: 6 }}>TU MENSAJE</div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={500}
              rows={5}
              style={{ width: '100%', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 10, outline: 'none', resize: 'none', lineHeight: 1.6 }}
            />

            <div style={{ background: 'rgba(26,71,49,.06)', border: '1px solid rgba(26,71,49,.12)', borderRadius: 10, padding: '10px 12px', marginTop: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--tl)', lineHeight: 1.5 }}>
                🔒 <b>Privacidad:</b> Si el otro miembro no acepta, no recibirás notificación de rechazo. Simplemente no habrá respuesta.
              </div>
            </div>

            <button className="post-btn" onClick={send} disabled={sending || !message.trim()}>
              {sending ? 'Enviando...' : 'Enviar propuesta →'}
            </button>
          </div>
        </>
      ) : (
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1.2rem', marginBottom: 8 }}>Propuesta enviada</div>
          <div style={{ fontSize: 13, color: 'var(--mut)', lineHeight: 1.6, marginBottom: 20 }}>
            {target?.full_name?.split(' ')[0]} recibirá tu mensaje. Si hay interés mutuo, la conexión se activará.
          </div>
          <button className="post-btn" onClick={onClose}>Cerrar</button>
        </div>
      )}
    </div>
  );
}
