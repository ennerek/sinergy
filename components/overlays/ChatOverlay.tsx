'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Analiza mis sinergias',
  '¿Qué ofrezco de valor?',
  'Ayúdame a escribir un busco',
  'Explícame cómo funciona la red',
];

interface Props {
  open: boolean;
  onClose: () => void;
  profile: any;
}

export default function ChatOverlay({ open, onClose, profile }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `¡Hola, ${profile?.full_name?.split(' ')[0] || 'empresario'}! Soy SISI, tu asistente de sinergias. ¿En qué puedo ayudarte hoy?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    const history = messages.slice(-12);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/sisi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data?.error || 'No pude procesar tu solicitud ahora mismo.' }]);
        return;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Lo siento, no pude procesar eso.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Por favor, inténtalo de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="overlay chat-overlay">
      <div className="ov-hdr">
        <div className="ov-title">
          <div className="smc-av">S</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>SISI</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Asistente de sinergias IA</div>
          </div>
        </div>
        <button className="ov-close" onClick={onClose}>✕</button>
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            {m.role === 'assistant' && <div className="chat-av">S</div>}
            <div className="chat-bubble">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg assistant">
            <div className="chat-av">S</div>
            <div className="chat-bubble chat-typing"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length < 3 && (
        <div className="chat-suggestions">
          {SUGGESTIONS.map(s => (
            <button key={s} className="chat-sug" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="chat-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Escribe tu pregunta..."
          className="chat-input"
        />
        <button className="chat-send" onClick={() => send()} disabled={!input.trim() || loading}>→</button>
      </div>
    </div>
  );
}
