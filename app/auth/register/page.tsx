'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const formatSignUpError = (err: unknown) => {
    if (!err || typeof err !== 'object') return 'No se pudo crear la cuenta. Inténtalo de nuevo.';
    const e = err as { message?: string; code?: string; status?: number };
    const base = e.message || 'No se pudo crear la cuenta.';
    const details = [e.code, e.status].filter(Boolean).join(' · ');
    return details ? `${base} (${details})` : base;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { lang: 'es' } },
    });

    if (signUpError) {
      console.error('Supabase signUp failed', signUpError);
      setError(formatSignUpError(signUpError));
      setLoading(false);
      return;
    }

    setLoading(false);
    setSent(true);
  };

  const handleGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  if (sent) {
    return (
      <div style={{ background: '#14140F', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(184,146,46,0.15)', border: '1px solid rgba(184,146,46,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>✉️</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: 12 }}>Revisa tu correo</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 8 }}>
            Hemos enviado un enlace de confirmación a
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#E5CE82', marginBottom: 20 }}>{email}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 32 }}>
            Haz clic en el enlace del email para activar tu cuenta y acceder al círculo. Si no lo ves, revisa la carpeta de spam.
          </div>
          <Link href="/auth/login" style={{ display: 'inline-block', padding: '12px 28px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 50, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#14140F', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
            Makers Synergy <span style={{ color: '#B8922E' }}>Charity</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>Crea tu cuenta en el círculo</div>
        </div>

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
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>CONTRASEÑA</div>
            <input
              className="auth-input"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>CONFIRMAR CONTRASEÑA</div>
            <input
              className="auth-input"
              type="password"
              placeholder="Repite la contraseña"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(200,112,58,0.15)', border: '1px solid rgba(200,112,58,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C8703A' }}>
              {error}
            </div>
          )}

          <button className="auth-btn" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>o</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <button className="auth-btn-google" onClick={handleGoogle} type="button">
          <span>🔵</span> Continuar con Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" style={{ color: '#E5CE82', textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
        </div>
      </div>
    </div>
  );
}
