'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ShoppingBag, Camera, RotateCcw, CheckCircle, Shield, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  email_verified: boolean;
  created_at: string;
}

interface Orden {
  id: string;
  total_usd: number;
  status: string;
  created_at: string;
  evento: { nombre: string; ciudad: string };
}

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<'perfil' | 'compras'>('perfil');

  // Verificación email
  const [mostrarVerifEmail, setMostrarVerifEmail] = useState(false);
  const [codigoEmail, setCodigoEmail] = useState('');
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [verificandoEmail, setVerificandoEmail] = useState(false);
  const [codigoDevEmail, setCodigoDevEmail] = useState('');

  // Cámara
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [guardandoSelfie, setGuardandoSelfie] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [{ data }, { data: dataOrdenes }] = await Promise.all([
          api.get('/auth/perfil'),
          api.get('/ordenes')
        ]);
        setUsuario(data.datos);
        setOrdenes(dataOrdenes.datos || []);
      } catch {
        router.push('/login');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [router]);

  // ---- VERIFICACIÓN EMAIL ----
  const enviarCodigoEmail = async () => {
    if (!usuario) return;
    setEnviandoEmail(true);
    try {
      const { data } = await api.post('/auth/reenviar-codigo', { email: usuario.email });
      if (data.datos?.codigoDesarrollo) {
        setCodigoDevEmail(data.datos.codigoDesarrollo);
        toast.success(`Código de desarrollo: ${data.datos.codigoDesarrollo}`, { duration: 15000 });
      } else {
        toast.success('Código enviado a tu correo');
      }
      setMostrarVerifEmail(true);
    } catch {
      toast.error('Error al enviar código');
    } finally {
      setEnviandoEmail(false);
    }
  };

  const verificarEmail = async () => {
    if (!usuario || codigoEmail.length !== 6) return;
    setVerificandoEmail(true);
    try {
      await api.post('/auth/verificar-codigo', { email: usuario.email, codigo: codigoEmail });
      toast.success('¡Correo verificado correctamente!');
      setUsuario(prev => prev ? { ...prev, email_verified: true } : null);
      setMostrarVerifEmail(false);
      setCodigoEmail('');
      setCodigoDevEmail('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { mensaje?: string } } };
      toast.error(error.response?.data?.mensaje || 'Código incorrecto');
    } finally {
      setVerificandoEmail(false);
    }
  };

  // ---- CÁMARA ----
  const abrirCamara = async () => {
    setFotoCapturada(null);
    setMostrarCamara(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch { toast.error('No se pudo acceder a la cámara'); setMostrarCamara(false); }
  };

  const tomarFoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setFotoCapturada(canvas.toDataURL('image/jpeg', 0.8));
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const reintentar = async () => {
    setFotoCapturada(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch { toast.error('Error al acceder a la cámara'); }
  };

  const cerrarCamara = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setMostrarCamara(false); setFotoCapturada(null);
  };

  const guardarSelfie = async () => {
    if (!fotoCapturada) return;
    setGuardandoSelfie(true);
    try {
      await api.put(`/usuarios/${usuario?.id}`, { avatar_url: fotoCapturada });
      toast.success('¡Selfie guardada! Reconocimiento facial activo');
      setUsuario(prev => prev ? { ...prev, avatar_url: fotoCapturada } : null);
      cerrarCamara();
    } catch { toast.error('Error al guardar selfie'); }
    finally { setGuardandoSelfie(false); }
  };

  const cerrarSesion = () => { localStorage.removeItem('token'); router.push('/'); };

  if (cargando) return <LoadingScreen variant="cliente" />;

  if (!usuario) return null;

  const iniciales = usuario.nombre.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const totalGastado = ordenes.filter(o => o.status === 'PAGADO').reduce((sum, o) => sum + Number(o.total_usd), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/Logo.png" alt="FR" style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', letterSpacing: '1px' }}>FOTORUNNER</span>
        </Link>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Ver eventos</Link>
          <button onClick={cerrarSesion}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '7px 14px', cursor: 'pointer', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
            <LogOut size={14} /> Salir
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)', padding: '48px 32px 96px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.12), transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '5%', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)' }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              {usuario.avatar_url ? (
                <img src={usuario.avatar_url} alt={usuario.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'white', fontSize: '34px', fontWeight: 900 }}>{iniciales}</span>
              )}
            </div>
            <button onClick={abrirCamara}
              style={{ position: 'absolute', bottom: 0, right: 0, width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', border: '2.5px solid #0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              <Camera size={13} color="white" />
            </button>
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'white', margin: 0 }}>{usuario.nombre}</h1>
              {usuario.email_verified && (
                <span style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(74,222,128,0.3)' }}>
                  <CheckCircle size={10} /> Verificado
                </span>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '14px' }}>{usuario.email}</p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                <Calendar size={12} /> Desde {new Date(usuario.created_at).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                <MapPin size={12} /> Ecuador
              </span>
              <span style={{ background: 'rgba(14,165,233,0.2)', color: '#38bdf8', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', border: '1px solid rgba(56,189,248,0.3)' }}>
                Corredor
              </span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { valor: ordenes.filter(o => o.status === 'PAGADO').length, label: 'Compras', color: '#38bdf8' },
              { valor: `$${totalGastado.toFixed(0)}`, label: 'Invertido', color: '#a78bfa' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '16px 24px', border: '1px solid rgba(255,255,255,0.1)', minWidth: '90px' }}>
                <p style={{ color: stat.color, fontSize: '26px', fontWeight: 900, margin: '0 0 4px', lineHeight: 1 }}>{stat.valor}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ maxWidth: '960px', margin: '-48px auto 0', padding: '0 32px 60px', position: 'relative', zIndex: 2 }}>

        {/* TABS */}
        <div style={{ display: 'inline-flex', gap: '4px', backgroundColor: 'white', borderRadius: '14px', padding: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0', marginBottom: '20px' }}>
          {[
            { key: 'perfil', label: 'Mi perfil', icon: <Camera size={14} /> },
            { key: 'compras', label: 'Mis compras', icon: <ShoppingBag size={14} /> },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as 'perfil' | 'compras')}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700, background: tab === t.key ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'transparent', color: tab === t.key ? 'white' : '#64748b', transition: 'all 0.15s' }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {tab === 'perfil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Info personal */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={14} color="white" />
                </div>
                Información personal
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[
                  { label: 'NOMBRE COMPLETO', value: usuario.nombre },
                  { label: 'CORREO ELECTRÓNICO', value: usuario.email },
                  { label: 'TELÉFONO', value: usuario.phone || 'No registrado' },
                  { label: 'MIEMBRO DESDE', value: new Date(usuario.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }) },
                ].map((campo) => (
                  <div key={campo.label} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                    <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.8px' }}>{campo.label}</p>
                    <p style={{ color: '#0f172a', fontSize: '14px', fontWeight: 700 }}>{campo.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reconocimiento facial */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: usuario.avatar_url ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Camera size={22} color={usuario.avatar_url ? 'white' : '#94a3b8'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Reconocimiento facial</h3>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', backgroundColor: usuario.avatar_url ? '#f0fdf4' : '#fef9c3', color: usuario.avatar_url ? '#16a34a' : '#854d0e', border: `1px solid ${usuario.avatar_url ? '#bbf7d0' : '#fde68a'}` }}>
                      {usuario.avatar_url ? '✓ Activo' : '⏳ Pendiente'}
                    </span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
                    {usuario.avatar_url ? 'Tu selfie está activa. Te encontramos automáticamente en los eventos.' : 'Activa el reconocimiento facial para encontrarte automáticamente en las fotos de tus carreras.'}
                  </p>
                  <button onClick={abrirCamara}
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                    <Camera size={14} />
                    {usuario.avatar_url ? 'Actualizar selfie' : 'Activar ahora'}
                  </button>
                </div>
                {usuario.avatar_url && (
                  <div style={{ width: '68px', height: '68px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #0ea5e9', flexShrink: 0 }}>
                    <img src={usuario.avatar_url} alt="selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Seguridad — con verificación */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={14} color="white" />
                </div>
                Seguridad y verificaciones
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Email */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f0f0f0', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: usuario.email_verified ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mail size={18} color={usuario.email_verified ? 'white' : '#94a3b8'} />
                    </div>
                    <div>
                      <p style={{ color: '#0f172a', fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Correo electrónico</p>
                      <p style={{ color: '#64748b', fontSize: '12px' }}>{usuario.email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {usuario.email_verified ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '50px', border: '1px solid #bbf7d0' }}>
                        <CheckCircle size={13} /> Verificado
                      </span>
                    ) : (
                      <>
                        <span style={{ background: '#fef9c3', color: '#854d0e', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px', border: '1px solid #fde68a' }}>
                          Sin verificar
                        </span>
                        <button onClick={enviarCodigoEmail} disabled={enviandoEmail}
                          style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: enviandoEmail ? 'not-allowed' : 'pointer', opacity: enviandoEmail ? 0.7 : 1 }}>
                          {enviandoEmail ? 'Enviando...' : 'Verificar ahora'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Modal verificación email inline */}
                {mostrarVerifEmail && !usuario.email_verified && (
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(14,165,233,0.05), rgba(99,102,241,0.05))', borderRadius: '14px', border: '1px solid rgba(14,165,233,0.2)' }}>
                    <p style={{ color: '#0f172a', fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                      Ingresa el código enviado a <span style={{ color: '#0ea5e9' }}>{usuario.email}</span>
                    </p>
                    {codigoDevEmail && (
                      <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: '#92400e', marginBottom: '12px' }}>
                        Modo desarrollo — Código: <strong>{codigoDevEmail}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text" maxLength={6} value={codigoEmail}
                        onChange={(e) => setCodigoEmail(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        style={{ width: '140px', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '20px', fontWeight: 800, color: '#0f172a', outline: 'none', textAlign: 'center', letterSpacing: '6px', backgroundColor: 'white' }}
                        onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
                      />
                      <button onClick={verificarEmail} disabled={verificandoEmail || codigoEmail.length !== 6}
                        style={{ background: codigoEmail.length === 6 ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : '#e2e8f0', color: codigoEmail.length === 6 ? 'white' : '#94a3b8', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: codigoEmail.length === 6 ? 'pointer' : 'not-allowed' }}>
                        {verificandoEmail ? 'Verificando...' : 'Confirmar'}
                      </button>
                      <button onClick={() => { setMostrarVerifEmail(false); setCodigoEmail(''); }}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                        Cancelar
                      </button>
                    </div>
                    <button onClick={enviarCodigoEmail} disabled={enviandoEmail}
                      style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', padding: 0 }}>
                      {enviandoEmail ? 'Enviando...' : '¿No recibiste el código? Reenviar'}
                    </button>
                  </div>
                )}

                {/* Teléfono */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f0f0f0', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: usuario.phone ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Phone size={18} color={usuario.phone ? 'white' : '#94a3b8'} />
                    </div>
                    <div>
                      <p style={{ color: '#0f172a', fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Teléfono</p>
                      <p style={{ color: '#64748b', fontSize: '12px' }}>{usuario.phone || 'No registrado'}</p>
                    </div>
                  </div>
                  {usuario.phone ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '50px', border: '1px solid #bbf7d0' }}>
                      <CheckCircle size={13} /> Registrado
                    </span>
                  ) : (
                    <span style={{ background: '#f1f5f9', color: '#94a3b8', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px' }}>
                      No agregado
                    </span>
                  )}
                </div>

                {/* Contraseña */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f0f0f0', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={18} color="white" />
                    </div>
                    <div>
                      <p style={{ color: '#0f172a', fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Contraseña</p>
                      <p style={{ color: '#64748b', fontSize: '12px' }}>••••••••••</p>
                    </div>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '50px', border: '1px solid #bbf7d0' }}>
                    <CheckCircle size={13} /> Configurada
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'compras' && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={14} color="white" />
              </div>
              Mis compras
            </h2>
            {ordenes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ width: '72px', height: '72px', background: '#f1f5f9', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <ShoppingBag size={32} color="#cbd5e1" />
                </div>
                <p style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontSize: '16px' }}>Aún no tienes compras</p>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Encuentra tus fotos en los eventos y descárgalas en HD</p>
                <Link href="/" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', padding: '11px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                  Explorar eventos
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ordenes.map((orden) => (
                  <div key={orden.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', border: '1px solid #f0f0f0', borderRadius: '14px', background: '#f8fafc', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingBag size={18} color="white" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '2px' }}>{orden.evento.nombre}</p>
                        <p style={{ color: '#94a3b8', fontSize: '12px' }}>{orden.evento.ciudad} · {new Date(orden.created_at).toLocaleDateString('es-EC')}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 900, color: '#0ea5e9', fontSize: '17px', marginBottom: '4px' }}>${orden.total_usd}</p>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', backgroundColor: orden.status === 'PAGADO' ? '#f0fdf4' : '#fef9c3', color: orden.status === 'PAGADO' ? '#16a34a' : '#854d0e', border: `1px solid ${orden.status === 'PAGADO' ? '#bbf7d0' : '#fde68a'}` }}>
                        {orden.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL CÁMARA */}
      {mostrarCamara && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden', width: '100%', maxWidth: '720px', display: 'flex', position: 'relative' }}>
            <button onClick={cerrarCamara}
              style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10, width: '30px', height: '30px', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
            <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', minHeight: '360px' }}>
              {!fotoCapturada ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
                    <button onClick={tomarFoto}
                      style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'white', border: '3px solid rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={22} color="white" />
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <img src={fotoCapturada} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button onClick={reintentar}
                    style={{ position: 'absolute', bottom: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RotateCcw size={18} />
                  </button>
                </>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div style={{ width: '240px', padding: '28px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Camera size={22} color="white" />
                </div>
                <p style={{ color: '#0f172a', fontWeight: 800, fontSize: '15px', marginBottom: '6px' }}>
                  {!fotoCapturada ? 'Tómate una selfie' : '¿Se ve bien?'}
                </p>
                <p style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>
                  {!fotoCapturada ? 'Esta foto activa el reconocimiento automático en los eventos' : 'Confirma tu selfie para activar el reconocimiento facial'}
                </p>
              </div>
              {fotoCapturada && (
                <button onClick={guardarSelfie} disabled={guardandoSelfie}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: guardandoSelfie ? 'not-allowed' : 'pointer', opacity: guardandoSelfie ? 0.7 : 1 }}>
                  {guardandoSelfie ? 'Guardando...' : 'Confirmar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}