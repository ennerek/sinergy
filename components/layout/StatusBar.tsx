'use client';

import { useEffect, useState } from 'react';

export default function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sbar">
      <span>{time}</span>
      <div className="notch" />
      <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span>▲▲▲</span>
        <span>WiFi</span>
        <span>🔋</span>
      </span>
    </div>
  );
}
