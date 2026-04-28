import StatusBar from '@/components/layout/StatusBar';
import BottomNav from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#14140F', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Desktop top bar */}
      <div className="desktop-bar">
        <div className="d-logo">Makers Synergy <span>Charity</span></div>
        <div className="club-badge">
          <span className="club-dot" />
          Miembro del círculo · Rotary Valencia
        </div>
      </div>

      {/* Phone + side info wrapper */}
      <div className="phone-wrap">
        {/* Phone */}
        <div className="phone">
          <StatusBar />
          <div className="screens">
            {children}
          </div>
          <BottomNav />
        </div>

        {/* Desktop sidebar */}
        <div style={{ display: 'none', flexDirection: 'column', gap: 20, color: 'rgba(255,255,255,0.6)', fontSize: 13, maxWidth: 220, paddingTop: 20 }} className="app-sidebar">
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em' }}>SOBRE LA APP</div>
          <p style={{ lineHeight: 1.6 }}>Red privada de sinergias para empresarios. El 25% de cada cuota mensual va a proyectos de Makers-Ong.</p>
          <div style={{ background: 'rgba(184,146,46,0.1)', border: '1px solid rgba(184,146,46,0.2)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'rgba(229,206,130,0.8)' }}>
            ❤ Proyecto activo: Escuela rural en Senegal
          </div>
        </div>
      </div>
    </div>
  );
}
