'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { guardarToken } from '@/lib/auth';

export default function RegistroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [step, setStep] = useState<1 | 2>(1);
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [emailRegistrado, setEmailRegistrado] = useState('');
  const [codigoDevs, setCodigoDevs] = useState(''); // Solo en desarrollo
  const [codigo, setCodigo] = useState('');
  const [reenviando, setReenviando] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener mínimo 6 caracteres');
      return;
    }
    setCargando(true);
    try {
      const { data } = await api.post('/auth/registro', form);
      guardarToken(data.datos.token, data.datos.usuario.role);
      setEmailRegistrado(form.email);

      // En desarrollo el código viene en la respuesta
      if (data.datos.codigoDesarrollo) {
        setCodigoDevs(data.datos.codigoDesarrollo);
        toast.success(`Código: ${data.datos.codigoDesarrollo}`, { duration: 10000 });
      } else {
        toast.success('Te enviamos un código a tu correo');
      }
      setStep(2);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { mensaje?: string } } };
      toast.error(error.response?.data?.mensaje || 'Error al registrarse');
    } finally {
      setCargando(false);
    }
  };

  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }
    setCargando(true);
    try {
      await api.post('/auth/verificar-codigo', { email: emailRegistrado, codigo });
      toast.success('¡Correo verificado! Bienvenido a FotoRunner');
      if (redirect) {
        router.push(redirect);
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { mensaje?: string } } };
      toast.error(error.response?.data?.mensaje || 'Código incorrecto');
    } finally {
      setCargando(false);
    }
  };

  const reenviarCodigo = async () => {
    setReenviando(true);
    try {
      const { data } = await api.post('/auth/reenviar-codigo', { email: emailRegistrado });
      if (data.datos?.codigoDesarrollo) {
        setCodigoDevs(data.datos.codigoDesarrollo);
        toast.success(`Nuevo código: ${data.datos.codigoDesarrollo}`, { duration: 10000 });
      } else {
        toast.success('Código reenviado a tu correo');
      }
    } catch {
      toast.error('Error al reenviar código');
    } finally {
      setReenviando(false);
    }
  };

  const saltarVerificacion = () => {
    if (redirect) router.push(redirect);
    else router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'sans-serif' }}>

      {/* Foto izquierda */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'none' }}
        className="md-block">
        <img
          src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=1200&fit=crop"
          alt="running"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1))' }} />
      </div>

      {/* Formulario derecha */}
      <div style={{ width: '100%', maxWidth: '520px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '40px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/Logo.png" alt="FR" style={{ width: '30px', height: '30px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', letterSpacing: '1px' }}>FOTORUNNER</span>
        </Link>

        {/* STEP 1 — Formulario */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>Regístrate</h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>Completa tus datos para empezar</p>

            <form onSubmit={handleSubmit}>
              {/* Nombre */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="registro-nombre" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Nombre completo
                </label>
                <input
                  id="registro-nombre"
                  type="text" required value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Juan Pérez"
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
                  onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; e.target.style.backgroundColor = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="registro-email" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Email
                </label>
                <input
                  id="registro-email"
                  type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="tu@email.com"
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
                  onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; e.target.style.backgroundColor = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                />
              </div>

              {/* Teléfono */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="registro-phone" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Teléfono <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input
                  id="registro-phone"
                  type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0991234567"
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
                  onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; e.target.style.backgroundColor = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                />
              </div>

              {/* Contraseña */}
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="registro-password" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="registro-password"
                    type={verPassword ? 'text' : 'password'} required value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 48px 12px 16px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
                    onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; e.target.style.backgroundColor = 'white'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                  />
                  <button type="button" onClick={() => setVerPassword(!verPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={cargando}
                style={{ width: '100%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1, marginBottom: '16px' }}>
                {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>

              {/* Separador */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>o</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              </div>

              {/* Google */}
              <button type="button" onClick={() => toast('Google Auth próximamente')}
                style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: 600, color: '#374151', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </button>

              <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                ¿Ya tienes cuenta?{' '}
                <Link href={redirect ? `/login?redirect=${redirect}` : '/login'}
                  style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>
                  Iniciar sesión
                </Link>
              </p>
            </form>
          </>
        )}

        {/* STEP 2 — Verificación */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} color="white" />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>Verifica tu correo</h1>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                Enviamos un código de 6 dígitos a<br />
                <strong style={{ color: '#0f172a' }}>{emailRegistrado}</strong>
              </p>
              {codigoDevs && (
                <div style={{ marginTop: '12px', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#92400e' }}>
                  Modo desarrollo — Código: <strong>{codigoDevs}</strong>
                </div>
              )}
            </div>

            <form onSubmit={verificarCodigo}>
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="registro-codigo" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textAlign: 'center' }}>
                  Código de verificación
                </label>
                <input
                  id="registro-codigo"
                  type="text" maxLength={6} value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{ width: '100%', border: '2px solid #e2e8f0', borderRadius: '14px', padding: '16px', fontSize: '28px', fontWeight: 800, color: '#0f172a', outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '12px', backgroundColor: '#f8fafc' }}
                  onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
                />
              </div>

              <button type="submit" disabled={cargando || codigo.length !== 6}
                style={{ width: '100%', background: codigo.length === 6 ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : '#e2e8f0', color: codigo.length === 6 ? 'white' : '#94a3b8', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: codigo.length === 6 ? 'pointer' : 'not-allowed', marginBottom: '16px' }}>
                {cargando ? 'Verificando...' : 'Verificar código'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={reenviarCodigo} disabled={reenviando}
                  style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '12px' }}>
                  {reenviando ? 'Reenviando...' : '¿No recibiste el código? Reenviar'}
                </button>
                <br />
                <button type="button" onClick={saltarVerificacion}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>
                  Verificar más tarde →
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Foto derecha (desktop) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=1200&fit=crop"
          alt="running"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, transparent 60%, rgba(255,255,255,0.05))' }} />
      </div>
    </div>
  );
}