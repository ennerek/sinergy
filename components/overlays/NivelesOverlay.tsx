'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  open: boolean;
  onClose: () => void;
  currentLevel: number;
}

const TIERS = [
  {
    level: 1,
    name: 'Círculo Básico',
    price: 'Gratis',
    priceNote: '(Registro)',
    icon: 'I',
    color: '#1A4731',
    features: [
      'Acceso a tu grupo principal',
      '3 matches visibles por semana',
      'Chat SISI (5 consultas/mes)',
      '25% donado a Makers-Ong',
    ],
    cta: null,
    ctaLabel: 'Tu nivel actual',
  },
  {
    level: 2,
    name: 'Red Ampliada',
    price: '59€/mes',
    priceNote: 'IVA incluido',
    icon: '◆',
    color: '#B8922E',
    features: [
      'Acceso a todos los grupos',
      'Matches ilimitados + detalles',
      'Chat SISI ilimitado',
      'Reflections + mentoría red',
      '25% donado a Makers-Ong',
    ],
    cta: 'level2',
    ctaLabel: 'Activar Red Ampliada',
  },
  {
    level: 3,
    name: 'Inner Circle VIP',
    price: 'Por invitación',
    priceNote: 'Cuota privada',
    icon: '★',
    color: '#3C2F5A',
    features: [
      'Todo lo de Nivel 2',
      'Acceso a Inner Circle Global',
      'Sala de reuniones presencial',
      'Deal flow privado curado',
      '25% donado a Makers-Ong',
    ],
    cta: null,
    ctaLabel: 'Solo por invitación',
  },
];

export default function NivelesOverlay({ open, onClose, currentLevel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const upgrade = async (level: string) => {
    setLoading(level);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      });
      const { url } = await res.json();
      if (url) router.push(url);
    } catch { }
    setLoading(null);
  };

  if (!open) return null;

  return (
    <div className="overlay niveles-overlay">
      <div className="ov-hdr">
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 16 }}>Niveles de acceso</div>
        <button className="ov-close" onClick={onClose}>✕</button>
      </div>
      <div style={{ overflowY: 'auto', padding: '8px 16px 24px' }}>
        {TIERS.map(t => {
          const isCurrent = t.level === currentLevel;
          const isBelow = t.level < currentLevel;
          return (
            <div key={t.level} className={`tier-card${isCurrent ? ' current' : ''}`}
              style={{ border: `2px solid ${isCurrent ? t.color : 'var(--bdr)'}`, borderRadius: 16, padding: '14px 16px', marginBottom: 12, background: isCurrent ? `${t.color}08` : 'var(--white)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 900 }}>{t.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{t.name}</div>
                    {isCurrent && <span style={{ fontSize: 9, fontWeight: 700, background: t.color, color: '#fff', borderRadius: 4, padding: '2px 5px', letterSpacing: '.05em' }}>ACTUAL</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 15, color: 'var(--ink)' }}>{t.price}</div>
                  <div style={{ fontSize: 10, color: 'var(--mut)' }}>{t.priceNote}</div>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {t.features.map(f => (
                  <li key={f} style={{ fontSize: 12, color: 'var(--sft)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: t.color, fontSize: 11 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              {t.cta && !isCurrent && !isBelow && (
                <button
                  className="post-btn"
                  onClick={() => upgrade(t.cta!)}
                  disabled={loading === t.cta}
                  style={{ background: t.color }}
                >
                  {loading === t.cta ? 'Redirigiendo...' : t.ctaLabel}
                </button>
              )}
              {(isCurrent || isBelow) && (
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--mut)', fontStyle: 'italic' }}>{t.ctaLabel}</div>
              )}
              {t.level === 3 && !isCurrent && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#6B557A', fontStyle: 'italic' }}>{t.ctaLabel}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
