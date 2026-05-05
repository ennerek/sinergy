'use client';

import { useState } from 'react';
import NivelesOverlay from '@/components/overlays/NivelesOverlay';
import ContactOverlay from '@/components/overlays/ContactOverlay';

interface Reflection {
  id: string;
  user_id: string;
  content: string;
  reply_count: number;
  save_count: number;
  created_at: string;
  profiles: { full_name: string | null; sector: string | null } | { full_name: string | null; sector: string | null }[] | null;
}

interface Props {
  profile: any;
  userGroups: any[];
  connectionsCount: number;
  connections: { id: string; created_at: string; other: any }[];
  currentUserId: string;
  reflections: Reflection[];
}

const ALL_GROUPS = [
  { slug: 'rotary',        name: 'Rotary Club',             icon: '★', color: '#B8922E', tier: 1, members: 1240, source: 'Directo' },
  { slug: 'smart-meeting', name: 'Smart Meeting',           icon: '◆', color: '#1A4731', tier: 2, members: 680, source: 'Vía miembro' },
  { slug: 'bni',           name: 'BNI',                     icon: '▲', color: '#1A4731', tier: 2, members: 890, source: 'Vía miembro' },
  { slug: 'aje',           name: 'AJE Jóvenes',             icon: '✦', color: '#C8BBA0', tier: 2, members: 320, source: 'Vía red' },
  { slug: 'circulo',       name: 'Círculo Empresarios',     icon: '◇', color: '#C8BBA0', tier: 2, members: 210, source: 'Vía red' },
  { slug: 'inner-circle',  name: 'Inner Circle — Global',   icon: '◆', color: '#3C2F5A', tier: 3, members: 500, source: 'VIP · Por invitación' },
];

const TIER_LABELS = ['', 'NIVEL 1', 'NIVEL 2', '◆ VIP'];
const TIER_CLASSES = ['', 'tier-tag-1', 'tier-tag-2', 'tier-tag-3'];

export default function RedClient({ profile, userGroups, connectionsCount, connections, currentUserId, reflections: initialReflections }: Props) {
  const [nivelesOpen, setNivelesOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState<any>(null);
  const [reflections, setReflections] = useState<Reflection[]>(initialReflections);
  const [reflText, setReflText] = useState('');
  const [reflPosting, setReflPosting] = useState(false);

  const postReflection = async () => {
    if (!reflText.trim() || reflPosting) return;
    setReflPosting(true);
    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reflText.trim() }),
      });
      if (res.ok) {
        const newRef = await res.json();
        setReflections(prev => [{ ...newRef, profiles: { full_name: profile?.full_name ?? null, sector: null } }, ...prev]);
        setReflText('');
      }
    } finally {
      setReflPosting(false);
    }
  };
  const accessLevel = profile?.access_level ?? 1;
  const userName = profile?.full_name?.split(' ')[0] || 'Tú';

  const directSlugs = new Set(userGroups.map((g: any) => g.groups?.slug).filter(Boolean));

  const totalReach = ALL_GROUPS
    .filter(g => g.tier <= accessLevel)
    .reduce((sum, g) => sum + g.members, 0);

  return (
    <div className="sc on" id="sc-red" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="net-hdr">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="net-hl">Tu red neuronal</div>
            <div className="net-hs">Nodos activos · Densidad de conexiones</div>
          </div>
          <button className="tier-bar-btn" style={{ fontSize: 11 }} onClick={() => {}}>+ Añadir</button>
        </div>
        <div className="reach-big">
          <div className="reach-big-n">{totalReach.toLocaleString()}</div>
          <div className="reach-big-l">Empresarios en<br /><b>tu alcance total</b></div>
        </div>
      </div>

      {/* SVG Network */}
      <svg className="net-svg" viewBox="0 0 390 270">
        {/* Center node */}
        <circle cx="195" cy="135" r="28" fill="#1A4731" />
        <text x="195" y="130" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="'DM Sans'">{userName.slice(0,6)}</text>
        <text x="195" y="143" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8">Tú</text>

        {/* Group nodes */}
        {ALL_GROUPS.map((g, i) => {
          const angle = (i / ALL_GROUPS.length) * Math.PI * 2 - Math.PI / 2;
          const r = 95;
          const cx = 195 + r * Math.cos(angle);
          const cy = 135 + r * Math.sin(angle);
          const nodeR = Math.max(14, Math.min(22, g.members / 60));
          const isActive = directSlugs.has(g.slug);
          const isLocked = g.tier > accessLevel;
          const strokeColor = i === 0 ? '#B8922E' : isActive ? '#3DDB6E' : '#D4C8B8';
          const strokeW = isActive ? 2 : 1;

          return (
            <g key={g.slug}>
              <line x1="195" y1="135" x2={cx} y2={cy} stroke={strokeColor} strokeWidth={strokeW} strokeDasharray={isActive ? 'none' : '4 3'} opacity={isLocked ? 0.3 : 0.7} />
              <circle cx={cx} cy={cy} r={nodeR} fill={isLocked ? '#857870' : g.color} opacity={isLocked ? 0.5 : 1} />
              {isLocked && <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="10">🔒</text>}
              {!isLocked && <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{g.icon}</text>}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="net-legend">
        {[{ color: '#B8922E', label: 'Directo' }, { color: '#3DDB6E', label: '2º activo' }, { color: '#D4C8B8', label: '2º latente' }].map(l => (
          <div key={l.label} className="leg"><div className="legdot" style={{ background: l.color }} />{l.label}</div>
        ))}
      </div>

      {/* Tier bar */}
      <div className="tier-bar">
        <div className="tier-bar-ico">{accessLevel === 3 ? '◆' : accessLevel === 2 ? 'II' : 'I'}</div>
        <div className="tier-bar-info">
          <div className="tier-bar-lbl">TU NIVEL ACTUAL</div>
          <div className="tier-bar-val"><em>Nivel {accessLevel}</em>{accessLevel === 1 ? 'Círculo Básico' : accessLevel === 2 ? 'Red Ampliada' : 'Inner Circle VIP'}</div>
        </div>
        <button className="tier-bar-btn" onClick={() => setNivelesOpen(true)}>Ver niveles</button>
      </div>

      {/* Groups list */}
      <div className="pad">
        <div className="slbl">Grupos conectados</div>
        {ALL_GROUPS.map(g => {
          const isLocked = g.tier > accessLevel;
          return (
            <div key={g.slug} className={`group-row${isLocked ? ' locked' : ''}`} onClick={isLocked ? () => setNivelesOpen(true) : undefined}>
              <div className="group-icon" style={{ background: g.color }}>{g.icon}</div>
              <div className="group-name">
                <div className="group-nm">{g.name}</div>
                <div className="group-sub">{g.source}</div>
              </div>
              <div className="tier-col">
                <div className={`tier-tag ${TIER_CLASSES[g.tier]}`}>{TIER_LABELS[g.tier]}</div>
                <div className="group-count">{isLocked ? '???' : g.members.toLocaleString()}</div>
              </div>
            </div>
          );
        })}
        <div style={{ height: 20 }} />
      </div>

      {/* ── Mis conexiones ─────────────────────────────── */}
      <div className="pad" style={{ paddingTop: 0 }}>
        <div className="slbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Mis conexiones
          {connectionsCount > 0 && (
            <span style={{ background: 'var(--tl)', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 7px' }}>
              {connectionsCount}
            </span>
          )}
        </div>

        {connections.length === 0 ? (
          <div style={{ background: 'var(--white)', border: '1px solid var(--bdr)', borderRadius: 14, padding: '20px 16px', textAlign: 'center', color: 'var(--mut)', fontSize: 13 }}>
            Aún no tienes conexiones. Acepta solicitudes o propone contactos desde los matches.
          </div>
        ) : (
          connections.map(c => {
            const other = c.other;
            const name = other?.full_name || 'Usuario';
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={c.id} style={{
                background: 'var(--white)', border: '1px solid var(--bdr)', borderRadius: 14,
                padding: '11px 14px', marginBottom: 8, display: 'flex', gap: 11, alignItems: 'center',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'rgba(26,71,49,.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'var(--tl)', flexShrink: 0,
                }}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>{other?.company_name || other?.sector || 'Empresario'}</div>
                </div>
                <button
                  onClick={() => setContactTarget(other)}
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--tl)', background: 'rgba(26,71,49,.08)', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Contactar
                </button>
              </div>
            );
          })
        )}
        <div style={{ height: 20 }} />
      </div>

      {/* ── Reflexiones de la red ────────────────────────────────── */}
      <div className="pad" style={{ paddingTop: 0 }}>
        <div className="slbl">Reflexiones de la red</div>

        {/* Post form */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--bdr)', borderRadius: 14, padding: '11px 14px', marginBottom: 12 }}>
          <textarea
            value={reflText}
            onChange={e => setReflText(e.target.value.slice(0, 280))}
            placeholder="Comparte una reflexión con la red…"
            rows={2}
            style={{ width: '100%', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink)', border: 'none', outline: 'none', resize: 'none', lineHeight: 1.6, background: 'transparent' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--mut)' }}>{reflText.length}/280</span>
            <button
              className="tier-bar-btn"
              onClick={postReflection}
              disabled={reflPosting || !reflText.trim()}
            >
              {reflPosting ? 'Publicando…' : 'Publicar ✦'}
            </button>
          </div>
        </div>

        {reflections.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--mut)', fontSize: 13, padding: '12px 0' }}>
            Sé el primero en compartir una reflexión.
          </div>
        ) : (
          reflections.map(r => {
            const isOwn = r.user_id === currentUserId;
            const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
            const name = prof?.full_name || 'Usuario';
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={r.id} className="post-item" style={{ marginBottom: 8 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: isOwn ? 'rgba(26,71,49,.12)' : 'rgba(184,146,46,.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: isOwn ? 'var(--tl)' : '#A07820',
                }}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mut)', marginBottom: 2 }}>
                    {isOwn ? 'Tú' : name}
                    {prof?.sector ? <span style={{ fontWeight: 400 }}> · {prof.sector}</span> : null}
                    <span style={{ fontWeight: 400, marginLeft: 6 }}>{new Date(r.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{r.content}</div>
                  {(r.reply_count > 0 || r.save_count > 0) && (
                    <div style={{ marginTop: 5, display: 'flex', gap: 10, fontSize: 11, color: 'var(--mut)' }}>
                      {r.reply_count > 0 && <span>💬 {r.reply_count}</span>}
                      {r.save_count > 0 && <span>🔖 {r.save_count}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div style={{ height: 24 }} />
      </div>

      <NivelesOverlay open={nivelesOpen} onClose={() => setNivelesOpen(false)} currentLevel={accessLevel} />
      {contactTarget && (
        <ContactOverlay open={!!contactTarget} onClose={() => setContactTarget(null)} target={contactTarget} />
      )}
    </div>
  );
}
