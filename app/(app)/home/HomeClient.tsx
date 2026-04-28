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
}

const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export default function HomeClient({ profile, matches, synergiesCount, project, pulse, networkCount }: Props) {
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState<any>(null);
  const [nivelesOpen, setNivelesOpen] = useState(false);

  const now = new Date();
  const dateStr = `${DAYS_ES[now.getDay()]} ${now.getDate()} de ${MONTHS_ES[now.getMonth()]}`;
  const initials = (profile?.full_name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase();
  const groupName = (profile?.user_groups?.[0] as any)?.groups?.name || 'Red Synergy';
  const groupIcon = (profile?.user_groups?.[0] as any)?.groups?.icon || '★';

  const matchesCount = pulse?.matches_count ?? matches.length;
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
          matchId={contactTarget.match?.id}
        />
      )}
      <NivelesOverlay open={nivelesOpen} onClose={() => setNivelesOpen(false)} currentLevel={profile?.access_level ?? 1} />
    </div>
  );
}
