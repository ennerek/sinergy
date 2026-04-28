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
      </div>
    </div>
  );
}
