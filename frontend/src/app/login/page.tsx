'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { guardarToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { data } = await api.post('/auth/login', form);
      const { token, usuario } = data.datos;

      guardarToken(token, usuario.role);
      toast.success('¡Bienvenido!');

      if (usuario.role === 'ADMIN' || usuario.role === 'HELPER') {
        router.push('/admin');
      } else {
        router.push(redirect || '/');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { mensaje?: string } } };
      toast.error(error.response?.data?.mensaje || 'Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'white' }}>

      {/* FORMULARIO — Izquierda */}
      <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '40px' }}>
            <img src="/Logo.png" alt="FotoRunner"
              style={{ width: '44px', height: '44px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ fontWeight: 800, fontSize: '22px', color: '#0f172a', letterSpacing: '2px' }}>
              FOTORUNNER
            </span>
          </Link>

          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            Inicia sesión
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>
            Empieza a disfrutar de tus recuerdos
          </p>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="johndoe@gmail.com"
                style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#0ea5e9'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'; }}
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verPassword ? 'text' : 'password'} required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Introduce tu contraseña aquí"
                  style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '12px 48px 12px 16px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#0ea5e9'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'; }}
                />
                <button type="button" onClick={() => setVerPassword(!verPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botón */}
            <button type="submit" disabled={cargando}
              style={{ width: '100%', backgroundColor: cargando ? '#cbd5e1' : '#0ea5e9', background: cargando ? '#cbd5e1' : 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer', marginBottom: '20px', transition: 'opacity 0.2s' }}>
              {cargando ? 'Ingresando...' : 'Confirmar'}
            </button>
          </form>

          {/* Separador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>o</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
          </div>

          {/* Google */}
          <button
            onClick={() => toast('Google Auth próximamente', { icon: '🔜' })}
            style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: 600, color: '#374151', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            ¿Aún no estás registrado?{' '}
            <Link href={`/registro${redirect ? `?redirect=${redirect}` : ''}`}
              style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>
              Regístrate
            </Link>
          </p>

        </div>
      </div>

      {/* FOTO — Derecha */}
      <div style={{ flex: 1, position: 'relative', display: 'none' }} className="lg-block">
        <img
          src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=1000&fit=crop"
          alt="Corredor"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)', display: 'flex', alignItems: 'flex-end', padding: '48px' }}>
          <p style={{ color: 'white', fontSize: '30px', fontWeight: 800, lineHeight: 1.3 }}>
            ¡Di Patata! 📸<br />
            <span style={{ color: '#38bdf8' }}>Sonríele a las nuevas experiencias</span>
          </p>
        </div>
      </div>

      {/* Fix para mostrar la foto en pantallas grandes */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-block { display: block !important; }
        }
      `}</style>

    </div>
  );
}