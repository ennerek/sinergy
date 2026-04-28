'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import NivelesOverlay from '@/components/overlays/NivelesOverlay';
import ChatOverlay from '@/components/overlays/ChatOverlay';

interface Props {
  profile: any;
  synergiesCount: number;
  connectionsCount: number;
  matchesCount: number;
}

const INTERESTS_ALL = ['Tecnología', 'Inversión', 'Marketing', 'Legal', 'Salud', 'Educación', 'Sostenibilidad', 'Exportación', 'Recursos humanos'];
const TICKETS = ['Pre-seed', 'Seed', '< 100k', '100k–500k', '500k–2M', '2M+'];
const ROLES = ['Fundador', 'CEO', 'Director', 'Consultor', 'Inversor', 'Mentor', 'C-level'];

export default function PerfilClient({ profile, synergiesCount, connectionsCount, matchesCount }: Props) {
  const router = useRouter();
  const [nivelesOpen, setNivelesOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState(profile?.bio || '');
  const [savingBio, setSavingBio] = useState(false);

  const initials = (profile?.full_name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase();
  const groupName = (profile?.user_groups?.[0] as any)?.groups?.name || 'Red Synergy';
  const groupIcon = (profile?.user_groups?.[0] as any)?.groups?.icon || '★';
  const accessLabel = profile?.access_level === 3 ? '◆ Inner Circle' : profile?.access_level === 2 ? 'Red Ampliada' : 'Círculo Básico';

  const saveBio = async () => {
    setSavingBio(true);
    const supabase = createClient();
    await supabase.from('profiles').update({ bio }).eq('id', profile.id);
    setSavingBio(false);
    setEditMode(false);
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const interests: string[] = profile?.synergy_interests ?? [];
  const offerings: string[] = profile?.offerings ?? [];

  return (
    <div className="sc on" id="sc-perfil" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Profile header */}
      <div className="ph">
        <div className="ph-av">{initials}</div>
        <div className="ph-name">{profile?.full_name || 'Usuario'}</div>
        <div className="ph-role">{profile?.sector || profile?.role || 'Empresario'}</div>
        <div className="ph-group">{groupIcon} {groupName}</div>
        <div className="ph-badge">{accessLabel}</div>
      </div>

      {/* Stats grid */}
      <div className="pad">
        <div className="profile-stats">
          <div className="ps-item"><div className="ps-n">{matchesCount}</div><div className="ps-l">Matches</div></div>
          <div className="ps-item"><div className="ps-n">{connectionsCount}</div><div className="ps-l">Red</div></div>
          <div className="ps-item"><div className="ps-n">{synergiesCount}</div><div className="ps-l">Activas</div></div>
        </div>

        {/* Bio */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--bdr)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'var(--mut)' }}>BIO</span>
            <button onClick={() => setEditMode(!editMode)} style={{ fontSize: 11, color: 'var(--tl)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              {editMode ? 'Cancelar' : 'Editar'}
            </button>
          </div>
          {editMode ? (
            <div>
              <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={300}
                style={{ width: '100%', minHeight: 80, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink)', border: '1px solid var(--bdr)', borderRadius: 8, padding: 8, outline: 'none', resize: 'none' }} />
              <button className="post-btn" onClick={saveBio} disabled={savingBio} style={{ marginTop: 8 }}>
                {savingBio ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: bio ? 'var(--ink)' : 'var(--mut)', lineHeight: 1.6 }}>
              {bio || 'Añade una bio para que otros empresarios te conozcan.'}
            </div>
          )}
        </div>

        {/* Interests */}
        {interests.length > 0 && (
          <>
            <div className="slbl">Busco sinergias en</div>
            <div className="cps">{interests.map(i => (
              <span key={i} className="cp" style={{ background: 'rgba(26,71,49,.08)', border: '1px solid rgba(26,71,49,.15)', borderRadius: 50, padding: '4px 12px', fontSize: 12, color: 'var(--tl)' }}>{i}</span>
            ))}</div>
          </>
        )}

        {/* Offerings */}
        {offerings.length > 0 && (
          <>
            <div className="slbl">Puedo ofrecer</div>
            <div className="cps">{offerings.map(o => (
              <span key={o} className="cp" style={{ background: 'rgba(229,206,130,.12)', border: '1px solid rgba(229,206,130,.3)', borderRadius: 50, padding: '4px 12px', fontSize: 12, color: '#A07820' }}>{o}</span>
            ))}</div>
          </>
        )}

        {/* Settings menu */}
        <div className="slbl" style={{ marginTop: 12 }}>Configuración</div>
        {[
          { icon: '🤖', label: 'Hablar con SISI', action: () => setChatOpen(true) },
          { icon: '⬆', label: 'Mejorar nivel de acceso', action: () => setNivelesOpen(true) },
          { icon: '🔔', label: 'Notificaciones', action: () => {} },
          { icon: '🔒', label: 'Privacidad', action: () => {} },
        ].map(s => (
          <div key={s.label} className="si" onClick={s.action}>
            <span className="si-ico">{s.icon}</span>
            <span className="si-lbl">{s.label}</span>
            <span className="match-arrow">›</span>
          </div>
        ))}

        <button onClick={signOut}
          style={{ width: '100%', padding: '12px 0', background: 'none', border: '1px solid rgba(220,50,50,.25)', borderRadius: 12, color: '#C03030', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 16, fontFamily: "'DM Sans', sans-serif" }}>
          Cerrar sesión
        </button>
        <div style={{ height: 24 }} />
      </div>

      <NivelesOverlay open={nivelesOpen} onClose={() => setNivelesOpen(false)} currentLevel={profile?.access_level ?? 1} />
      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} profile={profile} />
    </div>
  );
}
