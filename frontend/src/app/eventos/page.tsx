'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Lock, X, CheckCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { agregarFoto, estaEnCarrito, contarItems } from '@/lib/carrito';

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

// SVG watermark como background-image — el método más confiable
const WATERMARK_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120">
  <text
    x="20" y="70"
    transform="rotate(-35, 120, 60)"
    font-family="Arial, sans-serif"
    font-size="15"
    font-weight="900"
    fill="rgba(255,255,255,0.65)"
    letter-spacing="4"
    style="text-shadow: 0 2px 4px black"
  >FOTORUNNER.EC</text>
</svg>
`);

const WATERMARK_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 10,
  pointerEvents: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=utf-8,${WATERMARK_SVG}")`,
  backgroundRepeat: 'repeat',
  backgroundSize: '240px 120px',
};

export default function EventoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [misFotos, setMisFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarMisFotos, setMostrarMisFotos] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<Foto | null>(null);
  const [logueado, setLogueado] = useState(false);
  const [itemsCarrito, setItemsCarrito] = useState(0);

  // Cámara
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLogueado(!!token);
    setItemsCarrito(contarItems());
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

  const abrirCamara = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push(`/registro?redirect=/eventos/${id}`); return; }
    setFotoCapturada(null);
    setMostrarCamara(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      setStreamRef(stream);
      if (videoRef) { videoRef.srcObject = stream; videoRef.play(); }
    } catch {
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
      if (videoRef) { videoRef.srcObject = stream; videoRef.play(); }
    } catch { toast.error('Error al acceder a la cámara'); }
  };

  const cerrarCamara = () => {
    streamRef?.getTracks().forEach(t => t.stop());
    setMostrarCamara(false);
    setFotoCapturada(null);
  };

  const buscarConSelfie = async () => {
    setProcesando(true);
    try {
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

  const manejarAdquirir = (foto: Foto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!logueado) { router.push(`/registro?redirect=/eventos/${id}`); return; }
    if (estaEnCarrito(foto.id)) { router.push('/carrito'); return; }
    if (evento) {
      agregarFoto({
        foto_id: foto.id,
        event_id: id,
        event_nombre: evento.nombre,
        foto_url: foto.gcs_watermark_url || foto.gcs_original_url,
      });
      setItemsCarrito(contarItems());
      toast.success('¡Foto agregada al carrito!');
    }
  };

  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
      <p style={{ color: '#64748b' }}>Cargando...</p>
    </div>
  );

  if (!evento) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Evento no encontrado</p>
        <Link href="/" style={{ color: '#0ea5e9', textDecoration: 'none' }}>← Volver al inicio</Link>
      </div>
    </div>
  );

  const fondoHero = fotos.length > 0
    ? (fotos[0].gcs_watermark_url || fotos[0].gcs_original_url)
    : (evento.cover_url || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1400&h=500&fit=crop');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/Logo.png" alt="FR" style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', letterSpacing: '1px' }}>FOTORUNNER</span>
        </Link>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {itemsCarrito > 0 && (
            <Link href="/carrito" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: '14px', fontWeight: 700, padding: '8px 14px', borderRadius: '10px', textDecoration: 'none', border: '1px solid #e2e8f0' }}>
              <ShoppingCart size={16} />
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', borderRadius: '50%', color: 'white', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {itemsCarrito}
              </span>
            </Link>
          )}
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
      <div style={{ position: 'relative', height: '380px', overflow: 'hidden' }}>
        <img src={fondoHero} alt="evento" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, width: '360px', backgroundColor: 'white', borderRadius: '20px', padding: '32px 28px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>Encuentra tus imágenes</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
            {logueado ? 'Activa la cámara para buscar tus fotos con IA' : 'Crea tu cuenta para encontrar tus fotos automáticamente'}
          </p>
          <button onClick={abrirCamara}
            style={{ width: '100%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: logueado ? '0' : '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            {logueado ? 'Buscar mis fotos con IA' : 'Hacer selfie y buscar'}
          </button>
          {!logueado && (
            <Link href={`/login?redirect=/eventos/${id}`} style={{ color: '#94a3b8', fontSize: '12px', textDecoration: 'none', display: 'block' }}>
              Ya tengo cuenta → Iniciar sesión
            </Link>
          )}
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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
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
                  {!fotoCapturada ? 'Incluye a todas las personas que te acompañaron' : 'Usaremos esta foto para encontrar tus imágenes'}
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

      {/* MIS FOTOS */}
      {mostrarMisFotos && (
        <div style={{ backgroundColor: '#f0fdf4', borderBottom: '2px solid #bbf7d0', padding: '20px 24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="#16a34a" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#14532d' }}>
                  {misFotos.length > 0 ? `¡Encontramos ${misFotos.length} fotos tuyas!` : 'No encontramos fotos tuyas aún'}
                </h3>
              </div>
              <button onClick={() => setMostrarMisFotos(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            {misFotos.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px' }}>El fotógrafo aún no procesó las fotos. Vuelve más tarde.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {misFotos.map((foto) => (
                  <div key={foto.id} onClick={() => setFotoAmpliada(foto)}
                    style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '3/2', cursor: 'pointer', border: '2px solid #16a34a' }}>
                    <img src={foto.gcs_watermark_url || foto.gcs_original_url} alt="Mi foto"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {/* Watermark SVG sobre mi foto */}
                    <div style={WATERMARK_STYLE} />
                    <div style={{ position: 'absolute', bottom: '6px', right: '6px', backgroundColor: '#16a34a', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px', zIndex: 20 }}>
                      ✓ Tu foto
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GALERÍA */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{evento.nombre}</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>
              {fotos.length} fotos · Vista previa con marca de agua · Compra para descargar en HD
            </p>
          </div>
          {itemsCarrito > 0 && (
            <Link href="/carrito" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
              <ShoppingCart size={16} /> Carrito ({itemsCarrito})
            </Link>
          )}
        </div>

        {fotos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', backgroundColor: 'white', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Las fotos estarán disponibles pronto</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>El fotógrafo está procesando las imágenes</p>
          </div>
        ) : (
          <>
            {/* GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {fotos.map((foto) => (
                <div key={foto.id}
                  onClick={() => setFotoAmpliada(foto)}
                  style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', aspectRatio: '3/2', cursor: 'pointer', backgroundColor: '#e2e8f0', border: estaEnCarrito(foto.id) ? '3px solid #0ea5e9' : '3px solid transparent', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}>

                  {/* IMAGEN */}
                  <img
                    src={foto.gcs_watermark_url || foto.gcs_original_url}
                    alt="Foto del evento"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />

                  {/* WATERMARK SVG BACKGROUND — siempre visible, encima de todo */}
                  <div style={WATERMARK_STYLE} />

                  {/* Gradiente inferior */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 50%)', zIndex: 15, pointerEvents: 'none' }} />

                  {/* Badge en carrito */}
                  {estaEnCarrito(foto.id) && (
                    <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#0ea5e9', color: 'white', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px', zIndex: 20, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShoppingCart size={10} /> En carrito
                    </div>
                  )}

                  {/* Controles inferiores */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Lock size={9} /> Vista previa
                    </span>
                    <button onClick={(e) => manejarAdquirir(foto, e)}
                      style={{ background: estaEnCarrito(foto.id) ? '#0ea5e9' : 'white', color: estaEnCarrito(foto.id) ? 'white' : '#0f172a', border: 'none', borderRadius: '50px', padding: '5px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShoppingCart size={10} />
                      {estaEnCarrito(foto.id) ? 'Ver carrito' : 'Adquirir'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Banner */}
            <div style={{ background: 'linear-gradient(135deg, #020617, #0f172a, #1e1b4b)', borderRadius: '20px', padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div>
                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>¿Apareces en estas fotos?</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', maxWidth: '360px', lineHeight: 1.6 }}>
                  Compra la foto y descárgala en HD sin marca de agua.
                </p>
              </div>
              <button onClick={abrirCamara}
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                {logueado ? 'Buscar mis fotos' : 'Registrarme gratis'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODAL FOTO AMPLIADA — con watermark SVG */}
      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '860px', width: '100%', position: 'relative' }}>

            {/* Imagen + watermark */}
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <img
                src={fotoAmpliada.gcs_watermark_url || fotoAmpliada.gcs_original_url}
                alt="Foto"
                style={{ width: '100%', display: 'block', maxHeight: '72vh', objectFit: 'contain', backgroundColor: '#000' }}
              />

              {/* WATERMARK SVG en el modal — más denso */}
              <div style={{
                ...WATERMARK_STYLE,
                backgroundSize: '200px 100px',
              }} />

              {/* Gradiente inferior */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '28px 20px 18px', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>🔒 Vista previa con marca de agua</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>Compra para descargar en HD sin marca de agua</p>
                </div>
                <button onClick={(e) => manejarAdquirir(fotoAmpliada, e)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: estaEnCarrito(fotoAmpliada.id) ? '#0ea5e9' : 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', padding: '12px 22px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', zIndex: 30 }}>
                  <ShoppingCart size={16} />
                  {estaEnCarrito(fotoAmpliada.id) ? 'Ver carrito' : 'Comprar en HD sin marca'}
                </button>
              </div>
            </div>

            {/* Cerrar */}
            <button onClick={() => setFotoAmpliada(null)}
              style={{ position: 'absolute', top: '-14px', right: '-14px', width: '36px', height: '36px', backgroundColor: 'white', border: 'none', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}