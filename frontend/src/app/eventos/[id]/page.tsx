'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Lock, X, CheckCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Evento {
  id: string;
  nombre: string;
  ciudad: string;
  fecha: string;
  tipo: string;
  cover_url: string | null;
  _count: { fotos: number };
}

interface Foto {
  id: string;
  gcs_original_url: string;
  gcs_watermark_url: string | null;
}

export default function EventoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [misFotos, setMisFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [mostrarMisFotos, setMostrarMisFotos] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<Foto | null>(null);
  const [logueado, setLogueado] = useState(false);

  // Estados cámara
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLogueado(!!token);
  }, []);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [{ data: dataEvento }, { data: dataFotos }] = await Promise.all([
          api.get(`/eventos/${id}`),
          api.get(`/fotos/evento/${id}`)
        ]);
        setEvento(dataEvento.datos);
        setFotos(dataFotos.datos);
      } catch {
        toast.error('Error al cargar el evento');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  // Abrir cámara
  const abrirCamara = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(`/registro?redirect=/eventos/${id}`);
      return;
    }
    setFotoCapturada(null);
    setMostrarCamara(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      toast.error('No se pudo acceder a la cámara');
      setMostrarCamara(false);
    }
  };

  // Tomar foto
  const tomarFoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setFotoCapturada(dataUrl);
    // Parar stream
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  // Reintentar
  const reintentar = async () => {
    setFotoCapturada(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      toast.error('No se pudo acceder a la cámara');
    }
  };

  // Cerrar cámara
  const cerrarCamara = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setMostrarCamara(false);
    setFotoCapturada(null);
  };

  // Buscar con selfie
  const buscarConSelfie = async () => {
    if (!fotoCapturada) return;
    setProcesando(true);
    try {
      // Por ahora busca las fotos del usuario en el evento
      const { data } = await api.get(`/fotos/mis-fotos?event_id=${id}`);
      setMisFotos(data.datos);
      setMostrarMisFotos(true);
      cerrarCamara();
      if (data.datos.length === 0) {
        toast('No encontramos fotos tuyas en este evento aún');
      } else {
        toast.success(`¡Encontramos ${data.datos.length} fotos tuyas!`);
      }
    } catch {
      toast.error('Error al buscar tus fotos');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Cargando...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Evento no encontrado</p>
          <Link href="/" style={{ color: '#0ea5e9', textDecoration: 'none' }}>← Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const fondoHero = fotos.length > 0
    ? (fotos[0].gcs_watermark_url || fotos[0].gcs_original_url)
    : (evento.cover_url || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1400&h=500&fit=crop');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', fontFamily: 'sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/Logo.png" alt="FR" style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', letterSpacing: '1px' }}>FOTORUNNER</span>
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          {logueado ? (
            <Link href="/perfil" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', fontSize: '14px', fontWeight: 700, padding: '8px 18px', borderRadius: '10px', textDecoration: 'none' }}>
              Mi perfil
            </Link>
          ) : (
            <>
              <Link href={`/login?redirect=/eventos/${id}`} style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, padding: '8px 16px', textDecoration: 'none', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                Iniciar sesión
              </Link>
              <Link href={`/registro?redirect=/eventos/${id}`} style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', fontSize: '14px', fontWeight: 700, padding: '8px 18px', borderRadius: '10px', textDecoration: 'none' }}>
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', height: '420px', overflow: 'hidden' }}>
        <img src={fondoHero} alt="evento"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />

        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10, width: '380px',
          backgroundColor: 'white', borderRadius: '20px',
          padding: '36px 32px', textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)'
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
            Encuentra tus imágenes
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
            {logueado
              ? 'Tómate una foto con tu cámara para encontrar tus imágenes'
              : 'Crea tu cuenta para buscar tus fotos automáticamente'}
          </p>

          <div style={{ margin: '0 auto 24px', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
              <path d="M8 20 L8 8 L20 8" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M52 8 L64 8 L64 20" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M64 52 L64 64 L52 64" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M20 64 L8 64 L8 52" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="26" cy="30" r="2.5" fill="#94a3b8"/>
              <circle cx="46" cy="30" r="2.5" fill="#94a3b8"/>
              <circle cx="36" cy="40" r="2" fill="#94a3b8"/>
              <path d="M29 48 Q36 52 43 48" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
          </div>

          <button onClick={abrirCamara}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: 'white', border: 'none', padding: '15px',
              borderRadius: '14px', fontWeight: 700, fontSize: '15px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginBottom: logueado ? '0' : '12px'
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            {logueado ? 'Hacer selfie' : 'Buscar mis fotos'}
          </button>

          {!logueado && (
            <Link href={`/login?redirect=/eventos/${id}`}
              style={{ color: '#94a3b8', fontSize: '12px', textDecoration: 'none', display: 'block', marginTop: '4px' }}>
              Ya tengo cuenta → Iniciar sesión
            </Link>
          )}
        </div>
      </div>

      {/* MODAL CÁMARA */}
      {mostrarCamara && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden', width: '100%', maxWidth: '820px', display: 'flex', position: 'relative' }}>

            {/* Botón cerrar */}
            <button onClick={cerrarCamara}
              style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, width: '32px', height: '32px', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>

            {/* Video o foto capturada */}
            <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', minHeight: '380px' }}>
              {!fotoCapturada ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {/* Botón capturar */}
                  <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button onClick={tomarFoto}
                      style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'white', border: '3px solid rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <img src={fotoCapturada} alt="Selfie"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {/* Botón reintentar */}
                  <button onClick={reintentar}
                    style={{ position: 'absolute', bottom: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RotateCcw size={20} />
                  </button>
                </>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Panel derecho */}
            <div style={{ width: '280px', padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
                <p style={{ color: '#0f172a', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
                  {!fotoCapturada ? 'Tómate una selfie' : '¿Todo bien?'}
                </p>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                  {!fotoCapturada
                    ? 'Recuerda incluir a todas las personas que te acompañaron ese día'
                    : 'Usaremos esta foto para encontrar tus imágenes en el evento'}
                </p>
              </div>

              {fotoCapturada && (
                <button onClick={buscarConSelfie} disabled={procesando}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: procesando ? 'not-allowed' : 'pointer', opacity: procesando ? 0.7 : 1 }}>
                  {procesando ? 'Buscando...' : 'Buscar mis fotos'}
                </button>
              )}

              {!fotoCapturada && (
                <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', lineHeight: 1.5 }}>
                  Haz clic en el botón de cámara para capturar tu selfie
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MIS FOTOS */}
      {mostrarMisFotos && (
        <div style={{ backgroundColor: '#f0fdf4', borderBottom: '2px solid #bbf7d0', padding: '24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="#16a34a" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#14532d' }}>
                  {misFotos.length > 0 ? `¡Encontramos ${misFotos.length} fotos tuyas!` : 'No encontramos fotos tuyas aún'}
                </h3>
              </div>
              <button onClick={() => setMostrarMisFotos(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            {misFotos.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                El fotógrafo aún no procesó las fotos o no apareces en ninguna. Vuelve más tarde.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {misFotos.map((foto) => (
                  <div key={foto.id} onClick={() => setFotoAmpliada(foto)}
                    style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '3/2', cursor: 'pointer', border: '2px solid #16a34a' }}>
                    <img src={foto.gcs_watermark_url || foto.gcs_original_url}
                      alt="Mi foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: '6px', right: '6px', backgroundColor: '#16a34a', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px' }}>
                      Tu foto
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ÁLBUMES */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Álbumes Públicos</h2>
        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '28px' }}>
          {fotos.length} fotos disponibles{fotos.length > 0 ? ' · Vista previa gratuita' : ''}
        </p>

        {fotos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Las fotos estarán disponibles pronto</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>El fotógrafo está procesando las imágenes del evento</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
              {fotos.map((foto) => (
                <div key={foto.id} onClick={() => setFotoAmpliada(foto)}
                  style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '3/2', cursor: 'pointer', backgroundColor: '#f1f5f9' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                  <img src={foto.gcs_watermark_url || foto.gcs_original_url} alt="Foto"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,0,0,0.45)';
                      const btn = e.currentTarget.querySelector('button') as HTMLButtonElement;
                      if (btn) btn.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,0,0,0)';
                      const btn = e.currentTarget.querySelector('button') as HTMLButtonElement;
                      if (btn) btn.style.opacity = '0';
                    }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!logueado) router.push(`/registro?redirect=/eventos/${id}`);
                        else toast('Módulo de pagos próximamente');
                      }}
                      style={{ background: 'white', border: 'none', borderRadius: '50px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0, transition: 'opacity 0.2s', color: '#0f172a' }}>
                      <ShoppingCart size={13} /> Adquirir
                    </button>
                  </div>
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={9} /> Vista previa
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'linear-gradient(135deg, #020617, #0f172a, #1e1b4b)', borderRadius: '20px', padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div>
                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>¿Apareces en estas fotos?</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', maxWidth: '360px', lineHeight: 1.6 }}>
                  {logueado ? 'Usa el reconocimiento facial para encontrar tus fotos.' : 'Regístrate y accede a todas las fotos en alta resolución.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={abrirCamara}
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  {logueado ? 'Hacer selfie' : 'Registrarme gratis'}
                </button>
                {!logueado && (
                  <Link href={`/login?redirect=/eventos/${id}`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '14px', border: '1px solid rgba(255,255,255,0.15)' }}>
                    Ya tengo cuenta
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL FOTO AMPLIADA */}
      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', position: 'relative' }}>
            <img src={fotoAmpliada.gcs_watermark_url || fotoAmpliada.gcs_original_url}
              alt="Foto ampliada" style={{ width: '100%', borderRadius: '16px' }} />
            <button onClick={() => setFotoAmpliada(null)}
              style={{ position: 'absolute', top: '-14px', right: '-14px', width: '36px', height: '36px', backgroundColor: 'white', border: 'none', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  if (!logueado) router.push(`/registro?redirect=/eventos/${id}`);
                  else toast('Módulo de pagos próximamente');
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', padding: '12px 28px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                <ShoppingCart size={16} /> Adquirir esta foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}