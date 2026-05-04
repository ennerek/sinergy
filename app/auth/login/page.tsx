'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError(signInError.message); setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('No se pudo recuperar tu sesión. Inténtalo de nuevo.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        lang: (user.user_metadata?.lang === 'en' ? 'en' : 'es'),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }

    router.refresh();
    router.push(profile?.onboarding_completed ? '/home' : '/onboarding');
  };

  const handleReset = async () => {
    if (!email) { setError('Introduce tu email primero'); return; }
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setResetSent(true);
  };

  return (
    <div style={{ background: '#14140F', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
            Makers Synergy <span style={{ color: '#B8922E' }}>Charity</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>Bienvenido de nuevo al círculo</div>
        </div>

        {resetSent ? (
          <div style={{ background: 'rgba(26,71,49,0.2)', border: '1px solid rgba(26,71,49,0.4)', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#E5CE82', fontSize: 14 }}>
            ✓ Email de recuperación enviado. Revisa tu bandeja.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>EMAIL</div>
              <input
                className="auth-input"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', color: 'rgba(255,255,255,0.45)' }}>CONTRASEÑA</div>
                <button type="button" onClick={handleReset} style={{ background: 'none', border: 'none', color: '#E5CE82', fontSize: 12, cursor: 'pointer' }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                className="auth-input"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(200,112,58,0.15)', border: '1px solid rgba(200,112,58,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C8703A' }}>
                {error}
              </div>
            )}

            <button className="auth-btn" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          ¿Aún no eres miembro?{' '}
          <Link href="/auth/register" style={{ color: '#E5CE82', textDecoration: 'none', fontWeight: 600 }}>Unirme al círculo</Link>
        </div>
      </div>
    </div>
  );
}
