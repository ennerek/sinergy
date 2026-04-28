import BottomNav from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-root">
      <div className="desktop-bar">
        <div className="d-logo">Makers Synergy <span>Charity</span></div>
        <div className="club-badge">
          <span className="club-dot" />
          Miembro del círculo · Rotary Valencia
        </div>
      </div>

      <div className="phone-wrap">
        <div className="phone">
          <main className="screens">{children}</main>
          <BottomNav />
        </div>

        <aside className="app-sidebar">
          <div className="app-sidebar-title">SOBRE LA APP</div>
          <p className="app-sidebar-copy">Red privada de sinergias para empresarios. El 25% de cada cuota mensual va a proyectos de Makers-Ong.</p>
          <div className="app-sidebar-card">
            ❤ Proyecto activo: Escuela rural en Senegal
          </div>
        </aside>
      </div>
    </div>
  );
}
