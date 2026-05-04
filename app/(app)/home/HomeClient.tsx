'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatOverlay from '@/components/overlays/ChatOverlay';
import ContactOverlay from '@/components/overlays/ContactOverlay';
import NivelesOverlay from '@/components/overlays/NivelesOverlay';

interface Props {
  profile: any;
  matches: any[];
  synergiesCount: number;
  project: any;
  pulse: any;
  networkCount: number;
  pendingRequests: any[];
}

const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export default function HomeClient({ profile, matches, synergiesCount, project, pulse, networkCount, pendingRequests }: Props) {
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState<any>(null);
  const [nivelesOpen, setNivelesOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>(pendingRequests);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);

  const respondRequest = async (id: string, accepted: boolean) => {
    await fetch(`/api/connections/${id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accepted }),
    });
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const now = new Date();
  const dateStr = `${DAYS_ES[now.getDay()]} ${now.getDate()} de ${MONTHS_ES[now.getMonth()]}`;
  const initials = (profile?.full_name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase();
  const groupName = (profile?.user_groups?.[0] as any)?.groups?.name || 'Red Synergy';
  const groupIcon = (profile?.user_groups?.[0] as any)?.groups?.icon || '★';

  const matchesCount = matches.length || pulse?.matches_count || 0;
  const openCount = pulse?.open_requests ?? 0;
  const netCount = pulse?.network_count ?? networkCount;

  return (
    <div className="sc on" id="sc-home">
      {/* Header */}
      <div className="hh">
        <div className="htop">
          <div>
            <div className="hg">{dateStr}</div>
            <div className="hn">Buenos días,<br />{profile?.full_name?.split(' ')[0] || 'empresario'}</div>
          </div>
          <div className="hav">{initials}</div>
        </div>
        <div className="group-pill">{groupIcon} {groupName} · Miembro</div>
      </div>

      {/* Pulse Card */}
      <div className="pulse-card">
        <div className="pulse-top">
          <span className="pulse-h">PULSO DE LA SEMANA</span>
          <span className="pulse-c" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="sdot" />Activo
          </span>
        </div>
        <div className="pulse-grid">
          <div className="pulse-i"><div className="pulse-n">{matchesCount}</div><div className="pulse-l">MATCHES</div></div>
          <div className="pulse-i"><div className="pulse-n">{openCount}</div><div className="pulse-l">ABIERTOS</div></div>
          <div className="pulse-i"><div className="pulse-n">{netCount}</div><div className="pulse-l">EN TU RED</div></div>
        </div>
      </div>

      <div className="pad">
        {/* NGO Project card */}
        {project && (
          <div style={{ background: 'linear-gradient(135deg, var(--tl) 0%, #0E3426 100%)', borderRadius: 14, padding: 13, marginBottom: 11, color: '#fff' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'rgba(229,206,130,.8)', marginBottom: 6 }}>❤ PROYECTO ACTIVO · MAKERS-ONG</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1rem', marginBottom: 4 }}>{project.title}</div>
            <div style={{ height: 4, background: 'rgba(255,255,255,.2)', borderRadius: 4, marginBottom: 4 }}>
              <div style={{ width: `${Math.round((project.collected_amount / project.target_amount) * 100)}%`, height: '100%', background: 'linear-gradient(90deg,#E5CE82,#B8922E)', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>
              {project.collected_amount.toLocaleString('es-ES')}€ de {project.target_amount.toLocaleString('es-ES')}€ · <em style={{ fontFamily: "'Playfair Display', serif", color: '#E5CE82', fontWeight: 900 }}>25% DE CADA CUOTA</em>
            </div>
          </div>
        )}

        {/* Next step */}
        <div className="nxt" onClick={() => router.push('/sinergias')}>
          <div className="ni2">📝</div>
          <div>
            <div className="nt">SIGUIENTE PASO</div>
            <div className="ntx">{synergiesCount > 0 ? `Tienes ${synergiesCount} sinergias activas. Añade más.` : 'Publica tu primer busco y ofrezco esta semana.'}</div>
          </div>
          <span className="match-arrow">›</span>
        </div>

        {/* Quick shortcuts */}
        <div className="slbl">Atajos del círculo</div>
        <div className="cps">
          {[
            { icon: '🤖', label: 'Asistente IA', action: () => setChatOpen(true) },
            { icon: '🧠', label: 'Pedir consejo', action: () => router.push('/mentores') },
            { icon: '🕸️', label: 'Ver red', action: () => router.push('/red') },
            { icon: '🎯', label: 'Mis sinergias', action: () => router.push('/sinergias') },
          ].map(s => (
            <button key={s.label} className="cp" onClick={s.action} style={{ background: 'var(--white)', border: '1px solid var(--bdr)', borderRadius: 50, padding: '5px 11px', fontSize: 12, color: 'var(--sft)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Incoming connection requests */}
        {requests.length > 0 && (
          <>
            <div className="slbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Solicitudes recibidas
              <span style={{ background: '#E53E3E', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 7px' }}>{requests.length}</span>
            </div>
            {requests.map(req => {
              const from = req.from;
              const name = from?.full_name || 'Usuario';
              const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const isExpanded = expandedMsg === req.id;
              return (
                <div key={req.id} style={{
                  background: 'var(--white)', border: '1px solid var(--bdr)', borderRadius: 14,
                  padding: '12px 14px', marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, background: 'rgba(26,71,49,.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: 'var(--tl)', flexShrink: 0,
                    }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{name}</div>
                      <div style={{ fontSize: 11, color: 'var(--mut)' }}>{from?.company_name || from?.sector || 'Empresario'}</div>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--mut)' }}>
                      {new Date(req.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  {req.message && (
                    <div style={{
                      background: 'rgba(26,71,49,.05)', borderRadius: 8, padding: '8px 10px',
                      fontSize: 12, color: 'var(--ink)', lineHeight: 1.6, marginBottom: 10,
                      maxHeight: isExpanded ? 'none' : 56, overflow: 'hidden', position: 'relative',
                    }}>
                      {req.message}
                      {!isExpanded && req.message.length > 100 && (
                        <button onClick={() => setExpandedMsg(req.id)} style={{ display: 'block', fontSize: 11, color: 'var(--tl)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2, padding: 0 }}>
                          Ver más ↓
                        </button>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => respondRequest(req.id, true)}
                      style={{ flex: 1, background: 'var(--tl)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      ✓ Aceptar
                    </button>
                    <button
                      onClick={() => respondRequest(req.id, false)}
                      style={{ flex: 1, background: 'rgba(0,0,0,.05)', color: 'var(--mut)', border: 'none', borderRadius: 10, padding: '9px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Matches */}
        <div className="slbl">Matches detectados</div>
        {matches.map(match => {
          const other = match.user_id_a === profile?.id
            ? match['profiles!matches_user_id_b_fkey']
            : match['profiles!matches_user_id_a_fkey'];
          const isLocked = match.requires_level > (profile?.access_level ?? 1);
          const scoreClass = match.score >= 90 ? 'high' : match.score >= 70 ? 'med' : 'low';

          return (
            <div key={match.id} className="match-item">
              <div className={`match-score ${scoreClass}`}>
                <span className="n">{isLocked ? '??' : match.score}</span>
                <span className="l">MATCH</span>
              </div>
              <div className="match-info">
                <div className="match-name" style={isLocked ? { filter: 'blur(3.5px)' } : {}}>
                  {isLocked ? '███ ███████' : (other?.full_name || 'Anónimo')}
                </div>
                <div className="match-grp" style={isLocked ? { filter: 'blur(3px)' } : {}}>
                  {isLocked ? '██████' : (other?.company_name || other?.sector || 'Empresario')}
                </div>
                {match.score_reasons?.[0] && (
                  <div className="match-desc">{isLocked ? '🔒 Desbloquea para ver' : match.score_reasons[0]}</div>
                )}
              </div>
              <div className="match-act">
                {isLocked ? (
                  <button className="contact-btn" onClick={() => setNivelesOpen(true)}>🔒 Ver</button>
                ) : (
                  <button className="contact-btn" onClick={() => setContactTarget({ match, other })}>Proponer</button>
                )}
              </div>
            </div>
          );
        })}

        {matches.length === 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--bdr)', borderRadius: 14, padding: '20px 16px', textAlign: 'center', color: 'var(--mut)', fontSize: 13, marginBottom: 16 }}>
            SISI está calculando tus matches. Vuelve en unos minutos.
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>

      {/* Overlays */}
      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} profile={profile} />
      {contactTarget && (
        <ContactOverlay
          open
          onClose={() => setContactTarget(null)}
          target={contactTarget.other}
          matchId={contactTarget.match?.id ?? undefined}
        />
      )}
      <NivelesOverlay open={nivelesOpen} onClose={() => setNivelesOpen(false)} currentLevel={profile?.access_level ?? 1} />
    </div>
  );
}
