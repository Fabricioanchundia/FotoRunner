'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { guardarToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { data } = await api.post('/auth/login', form);
      guardarToken(data.datos.token);
      toast.success('¡Bienvenido!');
      router.push('/perfil');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { mensaje?: string } } };
      toast.error(error.response?.data?.mensaje || 'Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* FORMULARIO - Izquierda */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-10 py-12 bg-white">
        <div className="max-w-sm mx-auto w-full">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10">
            <Image
              src="/Logo.png"
              alt="FotoRunner"
              width={44}
              height={44}
              className="object-contain"
            />
            <span style={{ fontFamily: 'sans-serif', fontWeight: 800, fontSize: '22px', color: '#111', letterSpacing: '2px' }}>
              FOTORUNNER
            </span>
          </Link>

          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111', marginBottom: '4px' }}>
            Inicia sesión
          </h1>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '28px' }}>
            Empieza a disfrutar de tus recuerdos
          </p>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#333', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="johndoe@gmail.com"
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#111',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{ display: 'block', color: '#333', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Introduce tu contraseña aquí"
                  style={{
                    width: '100%',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px 48px 12px 16px',
                    fontSize: '14px',
                    color: '#111',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botón principal */}
            <button
              type="submit"
              disabled={cargando}
              style={{
                width: '100%',
                backgroundColor: cargando ? '#ccc' : '#FF6B00',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: cargando ? 'not-allowed' : 'pointer',
                marginBottom: '20px',
              }}
            >
              {cargando ? 'Ingresando...' : 'Confirmar'}
            </button>

          </form>

          {/* Separador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            <span style={{ color: '#999', fontSize: '12px' }}>o</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
          </div>

          {/* Google */}
          <button
            style={{
              width: '100%',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#333',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
            ¿Aún no estás registrado?{' '}
            <Link href="/registro" style={{ color: '#FF6B00', fontWeight: 700, textDecoration: 'none' }}>
              Regístrate
            </Link>
          </p>

        </div>
      </div>

      {/* FOTO - Derecha */}
      <div className="hidden lg:block" style={{ width: '50%', position: 'relative' }}>
        <img
          src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=1000&fit=crop"
          alt="Corredor"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
          display: 'flex', alignItems: 'flex-end', padding: '48px'
        }}>
          <p style={{ color: 'white', fontSize: '30px', fontWeight: 800, lineHeight: 1.3 }}>
            ¡Di Patata! 📸<br />
            <span style={{ color: '#FF8C33' }}>Sonríele a las nuevas experiencias</span>
          </p>
        </div>
      </div>

    </div>
  );
}