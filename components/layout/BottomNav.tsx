'use client';

import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { icon: '🏠', label: 'Inicio',    path: '/home' },
  { icon: '🎯', label: 'Sinergias', path: '/sinergias' },
  { icon: '🕸️', label: 'Red',       path: '/red' },
  { icon: '🧠', label: 'Mentores',  path: '/mentores' },
  { icon: '👤', label: 'Perfil',    path: '/perfil' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="bn">
      {NAV.map(({ icon, label, path }) => {
        const active = pathname === path;
        return (
          <button key={path} className={`nb${active ? ' on' : ''}`} onClick={() => router.push(path)}>
            <span className="ni">{icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.04em' }}>{label}</span>
            <span className="nd" />
          </button>
        );
      })}
    </nav>
  );
}
