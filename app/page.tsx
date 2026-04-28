import Link from 'next/link';

const GROUPS = [
  { icon: '★', name: 'Rotary Club', sub: 'Red internacional', color: '#B8922E', members: 1240 },
  { icon: '◆', name: 'Smart Meeting', sub: 'Fundadores & tech', color: '#1A4731', members: 680 },
  { icon: '▲', name: 'BNI', sub: 'Referral marketing', color: '#1A4731', members: 890 },
  { icon: '✦', name: 'AJE / Jóvenes', sub: 'Empresarios <41', color: '#C8BBA0', members: 320 },
  { icon: '◇', name: 'Círculo Empresarios', sub: 'Ex-CEOs & senior', color: '#C8BBA0', members: 210 },
  { icon: '◉', name: 'Otro grupo', sub: 'Especifica en perfil', color: '#2F7A5A', members: 72 },
];

export default function LandingPage() {
  return (
    <div className="landing-hero" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-.02em' }}>
          Makers Synergy <span style={{ color: '#B8922E' }}>Charity</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/auth/login" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none' }}>Entrar</Link>
          <Link href="/auth/register" style={{ background: '#1A4731', color: '#fff', padding: '9px 20px', borderRadius: 50, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Unirse →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        <div>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(184,146,46,0.1)', border: '1px solid rgba(184,146,46,0.25)', borderRadius: 50, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: '#E5CE82', letterSpacing: '.1em', marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3DDB6E', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            DONAS MIENTRAS GANAS
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
            Sinergias para<br />
            <span style={{ fontStyle: 'italic', color: '#E5CE82' }}>empresarios</span>
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
            Red privada de sinergias empresariales donde el 25% de tu cuota mensual financia proyectos de educación en África. Conecta, crece y dona al mismo tiempo.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/auth/register" style={{ background: '#1A4731', color: '#fff', padding: '14px 28px', borderRadius: 50, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Unirme al círculo →
            </Link>
            <Link href="/auth/login" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '14px 24px', borderRadius: 50, fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)' }}>
              Ya soy miembro
            </Link>
          </div>

          {/* Floating badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 50, padding: '7px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3DDB6E', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Miembro del círculo · Rotary Valencia
          </div>
        </div>

        {/* Phone mockup placeholder */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 280, height: 560, borderRadius: 40, background: '#ECE5DD', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(26,71,49,0.15)', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Mini header */}
            <div style={{ background: '#1A4731', padding: '20px 18px 24px', color: '#fff' }}>
              <div style={{ fontSize: 10, opacity: .7, marginBottom: 4 }}>Buenos días</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 900 }}>Carlos Martínez</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(184,146,46,0.2)', border: '1px solid rgba(184,146,46,0.4)', borderRadius: 50, padding: '3px 8px', fontSize: 10, color: '#E5CE82', marginTop: 8 }}>
                ★ Rotary Club · Miembro
              </div>
            </div>
            {/* Pulse card */}
            <div style={{ background: '#fff', border: '1px solid #D4C8B8', borderRadius: 14, padding: 13, margin: '-12px 14px 14px', boxShadow: '0 4px 20px rgba(26,22,18,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: '#100E0B' }}>PULSO DE LA SEMANA</span>
                <span style={{ color: '#1A4731', fontWeight: 600 }}>● Activo</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[['7', 'MATCHES'], ['3', 'ABIERTOS'], ['142', 'EN TU RED']].map(([n, l]) => (
                  <div key={l} style={{ textAlign: 'center', padding: '8px 4px', background: '#ECE5DD', borderRadius: 9 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 900, color: '#1A4731' }}>{n}</div>
                    <div style={{ fontSize: 9, color: '#857870', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Match preview */}
            <div style={{ padding: '0 14px' }}>
              {[{ score: 94, name: 'Ana Vidal', grp: 'Smart Meeting', cls: '#2F7A5A' }, { score: 82, name: 'Javier Ruiz', grp: 'Rotary Club', cls: '#B8922E' }].map(m => (
                <div key={m.name} style={{ background: '#fff', border: '1px solid #D4C8B8', borderRadius: 12, padding: 10, marginBottom: 8, display: 'flex', gap: 9, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: m.cls, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 13, color: '#fff' }}>{m.score}</span>
                    <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.7)', letterSpacing: '.1em' }}>MATCH</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#100E0B' }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: '#1A4731', fontWeight: 600 }}>{m.grp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: '#E5CE82', marginBottom: 12 }}>CÓMO FUNCIONA</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, color: '#fff' }}>El conector respeta tu privacidad</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {[
            { n: '1', title: 'Publicas', desc: 'Qué ofreces y qué buscas. Sin fotos, sin empresa visible.' },
            { n: '2', title: 'SISI cruza', desc: 'La IA analiza tu perfil con miles de miembros activos.' },
            { n: '3', title: 'Pide permiso', desc: 'Contacta a ambos por separado antes de compartir nada.' },
            { n: '4', title: 'Conexión directa', desc: 'Solo si los dos dicen sí, se comparten los datos de contacto.' },
          ].map(step => (
            <div key={step.n} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1A4731', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: 900, color: '#fff', fontSize: 14, marginBottom: 16 }}>{step.n}</div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 8, fontSize: 15 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28, background: 'rgba(26,71,49,0.15)', border: '1px solid rgba(26,71,49,0.3)', borderRadius: 12, padding: '12px 20px', fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          Tu teléfono, email y datos de contacto <strong style={{ color: '#E5CE82' }}>solo se comparten cuando ambos aceptáis</strong>.
        </div>
      </section>

      {/* STATS */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 80px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {[
          { n: '3.412', l: 'Miembros activos' },
          { n: '6', l: 'Grupos empresariales' },
          { n: '25%', l: 'Va a Makers-Ong' },
        ].map(s => (
          <div key={s.l} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 900, color: '#E5CE82', fontStyle: 'italic' }}>{s.n}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{s.l}</div>
          </div>
        ))}
      </section>

      {/* GROUPS */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: '#E5CE82', marginBottom: 12 }}>GRUPOS CONECTADOS</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 900, color: '#fff', marginBottom: 32 }}>Tu círculo ya está aquí</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
          {GROUPS.map(g => (
            <div key={g.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: 900, color: '#fff', fontSize: 16, marginBottom: 10 }}>{g.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{g.sub}</div>
              <div style={{ fontSize: 11, color: '#E5CE82', fontWeight: 600 }}>{g.members.toLocaleString()} miembros</div>
            </div>
          ))}
        </div>
      </section>

      {/* NGO PROJECT */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg, #1A4731 0%, #0E3426 100%)', borderRadius: 20, padding: '32px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', color: '#E5CE82', marginBottom: 8 }}>PROYECTO ACTIVO · MAKERS-ONG</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: 8 }}>Escuela rural en Senegal</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 20 }}>Educación primaria en zona rural · Senegal, África</p>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, height: 8, marginBottom: 8, overflow: 'hidden' }}>
              <div style={{ width: '68%', height: '100%', background: 'linear-gradient(90deg, #E5CE82, #B8922E)', borderRadius: 8 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              <span>4.240€ recaudados</span>
              <span>68% · Meta: 6.200€</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 900, color: '#E5CE82', fontStyle: 'italic', lineHeight: 1 }}>25%</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>de cada cuota</div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 100px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 900, color: '#fff', marginBottom: 16 }}>
          Tu círculo te está esperando
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
          Únete a la red privada de sinergias empresariales. 2 minutos de cuestionario y SISI empieza a trabajar para ti.
        </p>
        <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#B8922E', color: '#fff', padding: '16px 36px', borderRadius: 50, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
          Empezar → <span style={{ fontSize: 12, opacity: .8 }}>(2 minutos)</span>
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 40px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', width: '100%' }}>
        <span style={{ color: '#B8922E' }}>Diseñado por MAKERS-ONG</span> · Operado por PIAITIC · Pia Dreams 2026
      </footer>
    </div>
  );
}
