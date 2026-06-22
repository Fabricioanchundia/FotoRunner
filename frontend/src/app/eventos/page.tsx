'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, ShoppingCart, Camera, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { contarItems } from '@/lib/carrito';
import { WATERMARK_STYLE } from '@/lib/watermark';
import LoadingScreen from '@/components/LoadingScreen';

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
  event_id?: string;
}

function formatearFecha(fechaIso: string): string {
  try {
    const d = new Date(fechaIso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return fechaIso;
  }
}

export default function EventosPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [logueado, setLogueado] = useState(false);
  const [itemsCarrito, setItemsCarrito] = useState(0);

  // Cámara — búsqueda facial SIN evento específico (busca en todos)
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);
  const [misFotos, setMisFotos] = useState<Foto[]>([]);
  const [mostrarMisFotos, setMostrarMisFotos] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLogueado(!!token);
    setItemsCarrito(contarItems());
  }, []);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get('/eventos');
        setEventos(data.datos);
      } catch {
        toast.error('Error al cargar los eventos');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // Conecta el stream de la cámara al <video> en cuanto AMBOS existen,
  // evitando el problema de timing donde el <video> aún no está montado
  // cuando getUserMedia ya resolvió el stream.
  useEffect(() => {
    if (videoRef && streamRef) {
      videoRef.srcObject = streamRef;
      videoRef.play().catch(() => {});
    }
  }, [videoRef, streamRef]);

  const abrirCamara = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/registro?redirect=/eventos'); return; }
    setFotoCapturada(null);
    setMostrarCamara(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      setStreamRef(stream);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      toast.error('No se pudo acceder a la cámara');
      setMostrarCamara(false);
    }
  };

  const tomarFoto = () => {
    if (!videoRef || !canvasRef) return;
    canvasRef.width = videoRef.videoWidth;
    canvasRef.height = videoRef.videoHeight;
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef, 0, 0);
    setFotoCapturada(canvasRef.toDataURL('image/jpeg', 0.8));
    streamRef?.getTracks().forEach(t => t.stop());
  };

  const reintentar = async () => {
    setFotoCapturada(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStreamRef(stream);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      toast.error('Error al acceder a la cámara');
    }
  };

  const cerrarCamara = () => {
    streamRef?.getTracks().forEach(t => t.stop());
    setStreamRef(null);
    setMostrarCamara(false);
    setFotoCapturada(null);
  };

  // Busca SIN event_id: el backend ya soporta esto y devuelve coincidencias
  // de TODOS los eventos publicados, no solo uno.
  const buscarConSelfie = async () => {
    setProcesando(true);
    try {
      const { data } = await api.get('/fotos/mis-fotos');
      setMisFotos(data.datos);
      setMostrarMisFotos(true);
      cerrarCamara();
      if (data.datos.length === 0) {
        toast('No encontramos fotos tuyas en ningún evento aún');
      } else {
        toast.success(`¡Encontramos ${data.datos.length} fotos tuyas!`);
      }
    } catch {
      toast.error('Error al buscar tus fotos');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) return <LoadingScreen variant="cliente" />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', fontFamily: 'sans-serif' }}>

      {/* HEADER */}
      <header style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/Logo.png" alt="FR" style={{ width: '34px', height: '34px', objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', letterSpacing: '1px' }}>FOTORUNNER</span>
        </Link>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/carrito" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
            <span style={{ position: 'relative', display: 'flex' }}>
              <ShoppingCart size={20} />
              {itemsCarrito > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-8px', width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '50%', color: 'white', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {itemsCarrito}
                </span>
              )}
            </span>
          </Link>
          {logueado ? (
            <Link href="/perfil" style={{ background: '#312e81', color: 'white', fontSize: '14px', fontWeight: 700, padding: '10px 22px', borderRadius: '50px', textDecoration: 'none' }}>
              Mi perfil
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ background: '#312e81', color: 'white', fontSize: '14px', fontWeight: 700, padding: '10px 22px', borderRadius: '50px', textDecoration: 'none' }}>
                Iniciar sesión
              </Link>
              <Link href="/registro" style={{ color: '#0f172a', fontSize: '14px', fontWeight: 700, padding: '10px 22px', borderRadius: '50px', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </header>

      {/* HERO grande: ahora "Hacer selfie" SÍ abre la cámara directamente
          aquí, sin necesidad de elegir evento primero — la búsqueda corre
          contra todos los eventos publicados. */}
      <div style={{ position: 'relative', height: '340px', overflow: 'hidden' }}>
        <img src={eventos[0]?.cover_url || "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1400&h=500&fit=crop"} alt="FotoRunner"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, width: '380px', backgroundColor: 'white', borderRadius: '20px', padding: '32px 28px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>Encuentra tus imágenes</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
            Tómate una foto de tu rostro para encontrar tus imágenes
          </p>
          <button onClick={abrirCamara}
            style={{ width: '100%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Camera size={16} /> Hacer selfie
          </button>
        </div>
      </div>

      {/* MODAL CÁMARA */}
      {mostrarCamara && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden', width: '100%', maxWidth: '820px', display: 'flex', position: 'relative' }}>
            <button onClick={cerrarCamara} style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, width: '32px', height: '32px', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', minHeight: '380px' }}>
              {!fotoCapturada ? (
                <>
                  <video ref={(el) => setVideoRef(el)} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
                    <button onClick={tomarFoto} style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'white', border: '3px solid rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={18} color="white" />
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <img src={fotoCapturada} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button onClick={reintentar} style={{ position: 'absolute', bottom: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RotateCcw size={20} />
                  </button>
                </>
              )}
              <canvas ref={(el) => setCanvasRef(el)} style={{ display: 'none' }} />
            </div>
            <div style={{ width: '280px', padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
                <p style={{ color: '#0f172a', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
                  {!fotoCapturada ? 'Tómate una selfie' : '¿Todo bien?'}
                </p>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                  {!fotoCapturada ? 'Buscaremos en todos los eventos publicados' : 'Usaremos esta foto para encontrar tus imágenes'}
                </p>
              </div>
              {fotoCapturada && (
                <button onClick={buscarConSelfie} disabled={procesando}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: procesando ? 'not-allowed' : 'pointer', opacity: procesando ? 0.7 : 1 }}>
                  {procesando ? 'Buscando...' : 'Buscar mis fotos'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESULTADO DE BÚSQUEDA FACIAL (todos los eventos) */}
      {mostrarMisFotos && (
        <div style={{ backgroundColor: '#f0fdf4', borderTop: '2px solid #bbf7d0', borderBottom: '2px solid #bbf7d0', padding: '20px 32px', margin: '0 0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#14532d' }}>
              {misFotos.length > 0 ? `¡Encontramos ${misFotos.length} fotos tuyas!` : 'No encontramos fotos tuyas aún'}
            </h3>
            <button onClick={() => setMostrarMisFotos(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '16px' }}>✕</button>
          </div>
          {misFotos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {misFotos.map((foto) => (
                <div key={foto.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '3/2', border: '2px solid #16a34a' }}>
                  <img src={foto.gcs_watermark_url || foto.gcs_original_url} alt="Mi foto"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={WATERMARK_STYLE} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div id="lista-eventos" style={{ maxWidth: '1320px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}>
          Álbumes Públicos
        </h1>

        {eventos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Todavía no hay eventos publicados</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Vuelve más tarde para ver las próximas carreras</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {eventos.map((evento) => (
              <Link key={evento.id} href={`/eventos/${evento.id}`}
                style={{ textDecoration: 'none', color: 'inherit', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'block' }}>
                <div style={{ width: '100%', height: '160px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                  <img src={evento.cover_url || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=320&fit=crop'}
                    alt={evento.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    {evento.nombre}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                      <MapPin size={13} /> {evento.ciudad}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                      <Calendar size={13} /> {formatearFecha(evento.fecha)}
                    </span>
                  </div>
                  <p style={{ marginTop: '10px', color: '#94a3b8', fontSize: '12px' }}>
                    {evento._count?.fotos ?? 0} fotos
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}