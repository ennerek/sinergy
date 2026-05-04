'use client';

import { useState, useRef, useEffect } from 'react';
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

export default function PerfilClient({ profile, synergiesCount, connectionsCount, matchesCount }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nivelesOpen, setNivelesOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Editable fields — synced via useEffect so router.refresh() updates them
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [roleTitle, setRoleTitle] = useState(profile?.role_title || '');
  const [sector, setSector] = useState(profile?.sector || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [interests, setInterests] = useState<string[]>(profile?.synergy_interests ?? []);
  const [offerings, setOfferings] = useState<string[]>(profile?.offerings ?? []);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState(false);

  // Re-sync local state when server re-passes new profile data (after router.refresh())
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || '');
    setCompanyName(profile.company_name || '');
    setRoleTitle(profile.role_title || '');
    setSector(profile.sector || '');
    setBio(profile.bio || '');
    setInterests(profile.synergy_interests ?? []);
    setOfferings(profile.offerings ?? []);
    setAvatarUrl(profile.avatar_url || '');
  }, [profile]);

  const initials = (fullName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const groupName = (profile?.user_groups?.[0] as any)?.groups?.name || 'Red Synergy';
  const groupIcon = (profile?.user_groups?.[0] as any)?.groups?.icon || '★';
  const accessLabel = profile?.access_level === 3 ? '◆ Inner Circle' : profile?.access_level === 2 ? 'Red Ampliada' : 'Círculo Básico';

  const toggleInterest = (i: string) =>
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const toggleOffering = (o: string) =>
    setOfferings(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]);

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploadingPhoto(false); return; }
    const ext = file.name.split('.').pop();
    const path = `${user.id}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = data.publicUrl + '?t=' + Date.now();
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: url });
      setAvatarUrl(url);
    }
    setUploadingPhoto(false);
    e.target.value = '';
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError('');
    setSaveOk(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaveError('Sesión expirada. Recarga la página.');
      setSaving(false);
      return;
    }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      company_name: companyName,
      role_title: roleTitle,
      sector,
      bio,
      synergy_interests: interests,
      offerings,
    });
    setSaving(false);
    if (error) {
      setSaveError(error.message || 'No se pudo guardar. Inténtalo de nuevo.');
      return;
    }
    setSaveOk(true);
    setTimeout(() => {
      setEditMode(false);
      setSaveOk(false);
      router.refresh();
    }, 800);
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const openEdit = () => {
    setSaveError('');
    setSaveOk(false);
    setEditMode(true);
  };

  return (
    <div className="sc on" id="sc-perfil" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── PROFILE HEADER ── */}
      <div className="ph">
        <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} onClick={() => fileRef.current?.click()}>
          <div className="phav" style={{ overflow: 'hidden', padding: avatarUrl ? 0 : undefined }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
              : uploadingPhoto ? '…' : initials
            }
          </div>
          <div style={{
            position: 'absolute', bottom: -3, right: -3,
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--gd)', border: '2px solid var(--tl)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, color: '#fff', fontWeight: 900, lineHeight: 1,
          }}>+</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadPhoto} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="phn">{fullName || 'Usuario'}</div>
          <div className="php">
            {roleTitle || sector || 'Empresario'}
            {companyName ? <span style={{ opacity: .7 }}> · {companyName}</span> : null}
          </div>
          <div className="pll">{groupIcon} {groupName}</div>
        </div>

        <button
          onClick={openEdit}
          style={{
            flexShrink: 0, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)',
            borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 11,
            fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >Editar</button>
      </div>

      {/* Access level bar */}
      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--bdr)',
        padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tl)' }}>{accessLabel}</span>
        <button onClick={() => setNivelesOpen(true)} style={{
          fontSize: 11, color: 'var(--gd)', fontWeight: 700,
          background: 'none', border: 'none', cursor: 'pointer',
        }}>Mejorar nivel ›</button>
      </div>

      {/* ── BODY ── */}
      <div className="pad">

        <div className="pst" style={{ marginTop: 13 }}>
          <div className="ps"><div className="psn">{matchesCount}</div><div className="psl">Matches</div></div>
          <div className="ps"><div className="psn">{connectionsCount}</div><div className="psl">Conexiones</div></div>
          <div className="ps"><div className="psn">{synergiesCount}</div><div className="psl">Sinergias</div></div>
        </div>

        <div className="crd-box" style={{ marginBottom: 11 }}>
          <div className="slbl" style={{ marginBottom: 5 }}>Bio</div>
          <div style={{ fontSize: 13, color: bio ? 'var(--ink)' : 'var(--mut)', lineHeight: 1.6 }}>
            {bio || <span style={{ fontStyle: 'italic' }}>Añade una bio para que otros empresarios te conozcan.</span>}
          </div>
        </div>

        {interests.length > 0 && (
          <div style={{ marginBottom: 11 }}>
            <div className="slbl">Busco sinergias en</div>
            <div className="cps">
              {interests.map(i => (
                <span key={i} className="cp" style={{ background: 'rgba(26,71,49,.08)', border: '1px solid rgba(26,71,49,.15)', color: 'var(--tl)' }}>{i}</span>
              ))}
            </div>
          </div>
        )}

        {offerings.length > 0 && (
          <div style={{ marginBottom: 11 }}>
            <div className="slbl">Puedo ofrecer</div>
            <div className="cps">
              {offerings.map(o => (
                <span key={o} className="cp" style={{ background: 'rgba(229,206,130,.12)', border: '1px solid rgba(229,206,130,.3)', color: '#A07820' }}>{o}</span>
              ))}
            </div>
          </div>
        )}

        <div className="slbl" style={{ marginTop: 4 }}>Configuración</div>
        <div className="crd-box" style={{ padding: 0, overflow: 'hidden', marginBottom: 11 }}>
          {[
            { icon: '🤖', label: 'Hablar con SISI', sub: 'Asistente de inteligencia artificial', action: () => setChatOpen(true) },
            { icon: '✏️', label: 'Editar perfil', sub: 'Nombre, empresa, bio e intereses', action: openEdit },
            { icon: '🔒', label: 'Privacidad', sub: 'Datos y visibilidad', action: () => {} },
          ].map(s => (
            <div key={s.label} className="si" onClick={s.action}>
              <div className="sic"><span style={{ fontSize: 15 }}>{s.icon}</span></div>
              <div style={{ flex: 1 }}>
                <div className="sil">{s.label}</div>
                <div className="sis">{s.sub}</div>
              </div>
              <span className="sia">›</span>
            </div>
          ))}
        </div>

        <button onClick={signOut} style={{
          width: '100%', padding: '12px 0', background: 'none',
          border: '1px solid rgba(220,50,50,.25)', borderRadius: 12,
          color: '#C03030', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>Cerrar sesión</button>

        <div style={{ height: 24 }} />
      </div>

      {/* ── EDIT PANEL — uses same .overlay class as ChatOverlay/NivelesOverlay ── */}
      {editMode && (
        <div className="overlay" style={{ background: 'var(--pbg)', zIndex: 35, overflowY: 'auto' }}>
          {/* Sticky header */}
          <div style={{
            background: 'var(--tl)', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0,
            position: 'sticky', top: 0, zIndex: 1,
          }}>
            <button onClick={() => setEditMode(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0, opacity: .85, lineHeight: 1 }}>‹</button>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 900, color: '#fff', flex: 1 }}>Editar perfil</span>
            <button onClick={saveProfile} disabled={saving || saveOk} style={{
              background: saveOk ? '#2F7A5A' : saving ? 'rgba(255,255,255,.2)' : 'var(--gd)', border: 'none',
              borderRadius: 50, padding: '7px 16px',
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#fff', cursor: saving || saveOk ? 'default' : 'pointer',
            }}>{saveOk ? '✓ Guardado' : saving ? 'Guardando…' : 'Guardar'}</button>
          </div>

          <div style={{ padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {saveError && (
              <div style={{ background: 'rgba(200,50,50,.12)', border: '1px solid rgba(200,50,50,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C03030' }}>
                {saveError}
              </div>
            )}

            {/* Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} onClick={() => fileRef.current?.click()}>
                {avatarUrl
                  ? <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', border: '2px solid var(--gd)' }}>
                      <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  : <div style={{ width: 72, height: 72, borderRadius: 16, background: 'rgba(26,71,49,.07)', border: '2px dashed var(--bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 26 }}>📷</span>
                    </div>
                }
                <div style={{
                  position: 'absolute', bottom: -4, right: -4,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--gd)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11, color: '#fff', border: '2px solid var(--pbg)',
                }}>✎</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Foto de perfil</div>
                <div style={{ fontSize: 11, color: 'var(--mut)', lineHeight: 1.5 }}>
                  {uploadingPhoto ? 'Subiendo foto…' : 'JPG o PNG · visible para tu red'}
                </div>
                <button onClick={() => fileRef.current?.click()} style={{
                  marginTop: 7, padding: '5px 12px', borderRadius: 50,
                  background: 'none', border: '1px solid var(--bdr)',
                  fontSize: 11, fontWeight: 600, color: 'var(--sft)', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>Cambiar foto</button>
              </div>
            </div>

            {/* Text fields */}
            {([
              { label: 'Nombre completo', value: fullName, set: setFullName, placeholder: 'Tu nombre y apellidos' },
              { label: 'Empresa', value: companyName, set: setCompanyName, placeholder: 'Nombre de tu empresa o proyecto' },
              { label: 'Cargo', value: roleTitle, set: setRoleTitle, placeholder: 'CEO, Fundador, Director, Consultor…' },
              { label: 'Sector', value: sector, set: setSector, placeholder: 'Tecnología, Salud, Fintech, Retail…' },
            ] as { label: string; value: string; set: (v: string) => void; placeholder: string }[]).map(f => (
              <div key={f.label}>
                <div className="slbl" style={{ marginBottom: 5 }}>{f.label}</div>
                <input
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: '1.5px solid var(--bdr)', background: 'var(--white)',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink)', outline: 'none',
                  }}
                />
              </div>
            ))}

            {/* Bio */}
            <div>
              <div className="slbl" style={{ marginBottom: 5 }}>
                Bio <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--mut)' }}>({bio.length}/300)</span>
              </div>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="Cuéntale a otros empresarios quién eres y qué buscas…"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1.5px solid var(--bdr)', background: 'var(--white)',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink)',
                  outline: 'none', resize: 'none',
                }}
              />
            </div>

            {/* Interests */}
            <div>
              <div className="slbl" style={{ marginBottom: 8 }}>Busco sinergias en</div>
              <div className="cps">
                {INTERESTS_ALL.map(i => (
                  <span
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className="cp"
                    style={interests.includes(i)
                      ? { background: 'var(--tl)', border: '1px solid var(--tl)', color: '#fff' }
                      : {}}
                  >{i}</span>
                ))}
              </div>
            </div>

            {/* Offerings */}
            <div>
              <div className="slbl" style={{ marginBottom: 8 }}>Puedo ofrecer</div>
              <div className="cps">
                {INTERESTS_ALL.map(o => (
                  <span
                    key={o}
                    onClick={() => toggleOffering(o)}
                    className="cp"
                    style={offerings.includes(o)
                      ? { background: 'var(--gd)', border: '1px solid var(--gd)', color: '#fff' }
                      : {}}
                  >{o}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      <NivelesOverlay open={nivelesOpen} onClose={() => setNivelesOpen(false)} currentLevel={profile?.access_level ?? 1} />
      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} profile={profile} />
    </div>
  );
}
