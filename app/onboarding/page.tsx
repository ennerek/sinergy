'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const GROUPS = [
  { id: 'rotary',        icon: '★', label: 'Rotary Club',               sub: 'Red internacional de empresarios con vocación social' },
  { id: 'smart-meeting', icon: '◆', label: 'Smart Meeting',             sub: 'Comunidad de fundadores y directivos tech' },
  { id: 'bni',           icon: '▲', label: 'BNI',                       sub: 'Referral marketing entre empresarios locales' },
  { id: 'aje',           icon: '✦', label: 'AJE / Jóvenes empresarios', sub: 'Asociación de empresarios menores de 41' },
  { id: 'circulo',       icon: '◇', label: 'Círculo Empresarios',       sub: 'Ex-CEOs, consejeros, operadores senior' },
  { id: 'otro',          icon: '◉', label: 'Otro grupo',                sub: 'Especifica al completar el perfil' },
];

const SECTORS = [
  'Tecnología/Software', 'Servicios profesionales', 'Inmobiliario', 'Industria/Manufactura',
  'Salud y bienestar', 'Educación', 'Hostelería/Turismo', 'Finanzas/Inversión',
  'Consumo/Retail', 'Legal', 'Otro',
];

const SYNERGY_INTERESTS = [
  { id: 'clientes_cruzados', icon: '🤝', label: 'Clientes cruzados' },
  { id: 'complementariedad', icon: '🔗', label: 'Complementariedad' },
  { id: 'inversion',         icon: '💰', label: 'Inversión' },
  { id: 'eventos',           icon: '🎪', label: 'Eventos conjuntos' },
  { id: 'internacionalizacion', icon: '🌍', label: 'Internacionalización' },
  { id: 'mentoria',          icon: '🎓', label: 'Mentoría' },
];

const OFFERINGS = [
  { id: 'tecnologia',     icon: '💻', label: 'Tecnología/producto' },
  { id: 'red_contactos',  icon: '👥', label: 'Red de contactos' },
  { id: 'expertise',      icon: '🎓', label: 'Expertise' },
  { id: 'espacios',       icon: '🏢', label: 'Espacios o recursos' },
  { id: 'inversion',      icon: '💸', label: 'Inversión' },
  { id: 'eventos',        icon: '🎪', label: 'Organización eventos' },
];

type Step = 'splash' | 0 | 1 | 2 | 3 | 4 | 'result';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('splash');
  const [name, setName] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  const [sector, setSector] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [offerings, setOfferings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleArr = (arr: string[], val: string): string[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const progress = (n: number) => `${((n + 1) / 5) * 100}%`;

  const handleFinish = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    // Update profile
    await supabase.from('profiles').update({
      full_name: name,
      synergy_interests: interests,
      offerings: offerings,
      sector: sector,
      onboarding_completed: true,
      onboarding_answers: { name, groups, sector, interests, offerings },
    }).eq('id', user.id);

    // Insert user_groups
    const { data: groupsData } = await supabase.from('groups').select('id,slug').in('slug', groups);
    if (groupsData?.length) {
      await supabase.from('user_groups').upsert(
        groupsData.map(g => ({ user_id: user.id, group_id: g.id, is_direct: true })),
        { onConflict: 'user_id,group_id' }
      );
    }

    router.push('/home');
  };

  if (step === 'splash') {
    return (
      <div style={{ background: 'linear-gradient(180deg, #1A4731 0%, #0F3624 100%)', minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: 'rgba(229,206,130,0.8)', marginBottom: 24 }}>✦ ANTES DE EMPEZAR</div>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '2px solid rgba(229,206,130,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1.8rem', color: '#E5CE82', marginBottom: 24 }}>S</div>
        <blockquote style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.1rem,3vw,1.4rem)', fontStyle: 'italic', color: '#fff', lineHeight: 1.55, maxWidth: 440, marginBottom: 20 }}>
          &ldquo;Las mejores oportunidades no están en tu cabeza. Están cruzadas con las de otra persona que aún no conoces.&rdquo;
        </blockquote>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.2em', color: 'rgba(229,206,130,0.6)', marginBottom: 16 }}>SINERGIAS PARA EMPRESARIOS</div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, maxWidth: 360, marginBottom: 36 }}>
          SISI analiza tu perfil y lo cruza con 3.412 empresarios activos. En 2 minutos tendrás tus primeros matches.
        </p>
        <button className="ob-btn" style={{ maxWidth: 320 }} onClick={() => setStep(0)}>
          Empezar → <span style={{ opacity: .7, fontSize: 12 }}>(2 minutos)</span>
        </button>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div style={{ background: 'linear-gradient(180deg, #1A4731 0%, #0F3624 100%)', minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: 24, overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', padding: '32px 0 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: 'rgba(229,206,130,.8)', marginBottom: 12 }}>SISI · RESULTADO</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: 8 }}>Tu círculo está activo</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>SISI ha cruzado tu perfil con <strong style={{ color: '#E5CE82' }}>3.412 miembros</strong></p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480, margin: '0 auto', width: '100%' }}>
          {[
            { title: 'Tu posición en la red', body: `Has entrado con ${groups.length} grupo(s) directos. Nivel 1 activo.`, icon: '🕸️' },
            { title: 'Primeras sinergias detectadas', body: `${interests.length} intereses × ${offerings.length} ofertas = primeros matches en proceso.`, icon: '🎯' },
            { title: 'Regla del círculo', body: 'Publica un busco + ofrezco cada semana. La red se alimenta de actividad.', icon: '📋' },
          ].map(c => (
            <div key={c.title} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4, fontSize: 14 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}>{c.body}</div>
              </div>
            </div>
          ))}

          <div style={{ background: 'linear-gradient(135deg, #251A3F, #3C2F5A)', border: '1px solid rgba(229,206,130,.2)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: '#E5CE82', marginBottom: 6 }}>★ DONAS MIENTRAS GANAS</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', lineHeight: 1.5 }}>
              El <strong style={{ color: '#E5CE82' }}>25%</strong> de tu cuota mensual se destina a proyectos de Makers-Ong. Actualmente: escuela rural en Senegal.
            </div>
          </div>
        </div>

        <div style={{ padding: '28px 24px 0', maxWidth: 480, margin: '0 auto', width: '100%' }}>
          <button className="ob-btn" onClick={handleFinish} disabled={saving}>
            {saving ? 'Guardando...' : 'Entrar al círculo →'}
          </button>
        </div>
      </div>
    );
  }

  const stepNum = step as number;

  return (
    <div style={{ background: 'linear-gradient(180deg, #1A4731 0%, #0F3624 100%)', minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: 24, overflowY: 'auto' }}>
      {/* Progress */}
      <div style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginBottom: 6, fontWeight: 600 }}>Paso {stepNum + 1} de 5</div>
        <div className="ob-progress" style={{ marginBottom: 20 }}>
          <div className="ob-bar" style={{ width: progress(stepNum) }} />
        </div>

        {/* SISI bubble */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: 900, color: '#E5CE82', flexShrink: 0 }}>S</div>
          <div className="ob-bubble">
            {stepNum === 0 && 'Para empezar — ¿cómo te llamas?'}
            {stepNum === 1 && '¿A qué grupos empresariales perteneces? Puedes elegir varios.'}
            {stepNum === 2 && '¿En qué sector opera tu empresa?'}
            {stepNum === 3 && '¿Qué tipo de sinergias te interesan?'}
            {stepNum === 4 && '¿Y qué puedes ofrecer a la red?'}
          </div>
        </div>

        {/* Step content */}
        {stepNum === 0 && (
          <input
            className="auth-input"
            type="text"
            placeholder="Tu nombre y apellido..."
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        )}

        {stepNum === 1 && (
          <div>
            {GROUPS.map(g => (
              <div
                key={g.id}
                className={`ob-option${groups.includes(g.id) ? ' sel' : ''}`}
                onClick={() => setGroups(toggleArr(groups, g.id))}
              >
                <span className="ob-icon">{g.icon}</span>
                <div>
                  <div className="ob-lbl">{g.label}</div>
                  <div className="ob-sub">{g.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {stepNum === 2 && (
          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '13px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: sector ? '#fff' : 'rgba(255,255,255,.45)', outline: 'none' }}
          >
            <option value="" disabled style={{ background: '#1A4731' }}>Selecciona un sector...</option>
            {SECTORS.map(s => <option key={s} value={s} style={{ background: '#1A4731' }}>{s}</option>)}
          </select>
        )}

        {stepNum === 3 && (
          <div>
            {SYNERGY_INTERESTS.map(i => (
              <div
                key={i.id}
                className={`ob-option${interests.includes(i.id) ? ' sel' : ''}`}
                onClick={() => setInterests(toggleArr(interests, i.id))}
              >
                <span className="ob-icon">{i.icon}</span>
                <div className="ob-lbl">{i.label}</div>
              </div>
            ))}
          </div>
        )}

        {stepNum === 4 && (
          <div>
            {OFFERINGS.map(o => (
              <div
                key={o.id}
                className={`ob-option${offerings.includes(o.id) ? ' sel' : ''}`}
                onClick={() => setOfferings(toggleArr(offerings, o.id))}
              >
                <span className="ob-icon">{o.icon}</span>
                <div className="ob-lbl">{o.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Next button */}
        <button
          className="ob-btn"
          onClick={() => {
            if (stepNum === 0 && !name.trim()) return;
            if (stepNum === 1 && !groups.length) return;
            if (stepNum === 2 && !sector) return;
            if (stepNum === 3 && !interests.length) return;
            if (stepNum === 4) { setStep('result'); return; }
            setStep((stepNum + 1) as Step);
          }}
          disabled={
            (stepNum === 0 && !name.trim()) ||
            (stepNum === 1 && !groups.length) ||
            (stepNum === 2 && !sector) ||
            (stepNum === 3 && !interests.length) ||
            (stepNum === 4 && !offerings.length)
          }
        >
          {stepNum === 4 ? 'Ver mi círculo →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}
