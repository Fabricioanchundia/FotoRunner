'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Lock, X, CheckCircle, RotateCcw, MapPin, Calendar, Clock, Camera, Search, Share2, Check, Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { agregarFoto, quitarFoto, estaEnCarrito, contarItems } from '@/lib/carrito';
import { WATERMARK_STYLE } from '@/lib/watermark';

interface Evento {
  id: string;
  nombre: string;
  ciudad: string;
  fecha: string;
  tipo: string;
  disponible_hasta?: string | null;
  cover_url: string | null;
  _count: { fotos: number };
}

interface Foto {
  id: string;
  gcs_original_url: string;
  gcs_watermark_url: string | null;
  tamano_bytes?: number | null;
}

function formatearTamano(bytes?: number | null): string | null {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)}MB`;
}

// Marca de agua compartida con el carrito — ver src/lib/watermark.ts

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

  // Conecta el stream de la cámara al <video> en cuanto AMBOS existen.
  // Antes se intentaba conectar inmediatamente después de pedir el stream,
  // pero en ese momento React todavía no había montado el <video> en el
  // DOM (el modal recién se estaba abriendo), así que `videoRef` seguía
  // siendo null y el stream nunca se asignaba: la cámara quedaba en negro
  // aunque el permiso y el stream fueran correctos. Este efecto reacciona
  // a cualquiera de los dos cambios y conecta apenas ambos están listos.
  useEffect(() => {
    if (videoRef && streamRef) {
      videoRef.srcObject = streamRef;
      videoRef.play().catch(() => {
        // Algunos navegadores rechazan play() si el usuario no ha
        // interactuado aún; el atributo autoPlay del <video> lo retoma.
      });
    }
  }, [videoRef, streamRef]);

  const abrirCamara = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push(`/registro?redirect=/eventos/${id}`); return; }
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

  // Toggle de selección (check verde / botón +), independiente de ampliar.
  const alternarSeleccion = (foto: Foto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!logueado) { router.push(`/registro?redirect=/eventos/${id}`); return; }
    if (estaEnCarrito(foto.id)) {
      quitarFoto(foto.id);
      toast('Foto quitada');
    } else if (evento) {
      agregarFoto({
        foto_id: foto.id,
        event_id: id,
        event_nombre: evento.nombre,
        foto_url: foto.gcs_watermark_url || foto.gcs_original_url,
      });
      toast.success('¡Foto seleccionada!');
    }
    setItemsCarrito(contarItems());
  };

  const continuar = () => {
    if (!logueado) { router.push(`/registro?redirect=/eventos/${id}`); return; }
    router.push('/carrito');
  };

  // Navega a la foto anterior/siguiente dentro del modal ampliado, sin
  // cerrarlo. Usa la posición de la foto actual dentro del arreglo `fotos`.
  const navegarFoto = (direccion: 1 | -1) => {
    if (!fotoAmpliada) return;
    const indiceActual = fotos.findIndex(f => f.id === fotoAmpliada.id);
    if (indiceActual === -1) return;
    const total = fotos.length;
    const siguienteIndice = (indiceActual + direccion + total) % total;
    setFotoAmpliada(fotos[siguienteIndice]);
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', fontFamily: 'sans-serif', paddingBottom: itemsCarrito > 0 ? '96px' : '0' }}>

      {/* HEADER simple, estilo referencia */}
      <header style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src="/Logo.png" alt="FR" style={{ width: '34px', height: '34px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </Link>
          <Link href="/eventos" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Volver a eventos
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/carrito" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
            <span>{itemsCarrito} Imágenes</span>
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
              <Link href={`/login?redirect=/eventos/${id}`} style={{ background: '#312e81', color: 'white', fontSize: '14px', fontWeight: 700, padding: '10px 22px', borderRadius: '50px', textDecoration: 'none' }}>
                Iniciar sesión
              </Link>
              <Link href={`/registro?redirect=/eventos/${id}`} style={{ color: '#0f172a', fontSize: '14px', fontWeight: 700, padding: '10px 22px', borderRadius: '50px', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </header>

      {/* TÍTULO + METADATOS + ACCIONES */}
      <div style={{ padding: '8px 32px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', letterSpacing: '0.5px' }}>
            {evento.nombre?.toUpperCase()}
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '15px' }}>
              <MapPin size={16} /> {evento.ciudad}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '15px' }}>
              <Calendar size={16} /> Fecha: {formatearFecha(evento.fecha)}
            </span>
            {evento.disponible_hasta && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '15px' }}>
                <Clock size={16} /> Disponible hasta el: {formatearFecha(evento.disponible_hasta)}
              </span>
            )}
          </div>
          <button onClick={abrirCamara}
            style={{ marginTop: '18px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none', padding: '11px 20px', borderRadius: '50px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            <Camera size={15} /> Buscar mis fotos con mi rostro
          </button>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingTop: '6px' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a' }} aria-label="Buscar">
            <Search size={22} />
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a' }} aria-label="Compartir">
            <Share2 size={22} />
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

      {/* MIS FOTOS (resultado de búsqueda con IA) */}
      {mostrarMisFotos && (
        <div style={{ backgroundColor: '#f0fdf4', borderTop: '2px solid #bbf7d0', borderBottom: '2px solid #bbf7d0', padding: '20px 32px', margin: '0 0 16px' }}>
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
                  <div style={WATERMARK_STYLE} />
                  <div style={{ position: 'absolute', bottom: '6px', right: '6px', backgroundColor: '#16a34a', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px', zIndex: 20 }}>
                    ✓ Tu foto
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GALERÍA estilo referencia */}
      <div style={{ padding: '0 32px 40px' }}>
        {fotos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Las fotos estarán disponibles pronto</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>El fotógrafo está procesando las imágenes</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {fotos.map((foto) => {
              const seleccionada = estaEnCarrito(foto.id);
              return (
                <div key={foto.id}
                  onClick={() => setFotoAmpliada(foto)}
                  style={{
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    aspectRatio: '3/2',
                    cursor: 'pointer',
                    backgroundColor: '#e2e8f0',
                    border: seleccionada ? '3px solid #93c5fd' : '3px solid transparent',
                    boxShadow: seleccionada ? '0 4px 16px rgba(59,130,246,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                  }}>

                  {/* IMAGEN */}
                  <img
                    src={foto.gcs_watermark_url || foto.gcs_original_url}
                    alt="Foto del evento"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />

                  {/* WATERMARK */}
                  <div style={WATERMARK_STYLE} />

                  {/* Botón de selección: check verde o "+" gris, esquina sup. izq. */}
                  <button
                    onClick={(e) => alternarSeleccion(foto, e)}
                    aria-label={seleccionada ? 'Quitar selección' : 'Seleccionar foto'}
                    style={{
                      position: 'absolute', top: '10px', left: '10px', zIndex: 20,
                      width: '30px', height: '30px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: seleccionada ? '#16a34a' : 'rgba(255,255,255,0.85)',
                      color: seleccionada ? 'white' : '#475569',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    }}>
                    {seleccionada ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BARRA FLOTANTE "Continuar" */}
      {itemsCarrito > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#0f172a', padding: '18px', display: 'flex', justifyContent: 'center' }}>
          <button onClick={continuar}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', color: '#0f172a', border: 'none', padding: '14px 32px', borderRadius: '50px', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}>
            Continuar
            <span style={{ position: 'relative', display: 'flex' }}>
              <ShoppingCart size={18} />
              <span style={{ position: 'absolute', top: '-8px', right: '-10px', width: '17px', height: '17px', backgroundColor: '#ef4444', borderRadius: '50%', color: 'white', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {itemsCarrito}
              </span>
            </span>
          </button>
        </div>
      )}

      {/* MODAL FOTO AMPLIADA — layout de dos columnas estilo referencia:
          imagen con watermark a la izquierda, panel blanco informativo a la
          derecha, flechas de navegación a los costados. */}
      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

          {/* Flecha anterior */}
          {fotos.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); navegarFoto(-1); }}
              aria-label="Foto anterior"
              style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 210, width: '44px', height: '44px', borderRadius: '50%', border: 'none', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.35)', fontSize: '18px' }}>
              ←
            </button>
          )}

          <div onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '920px', width: '100%', maxHeight: '88vh', backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', display: 'flex', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', position: 'relative' }}>

            {/* Columna imagen */}
            <div style={{ position: 'relative', flex: '1 1 60%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
              <img
                src={fotoAmpliada.gcs_watermark_url || fotoAmpliada.gcs_original_url}
                alt="Foto"
                style={{ width: '100%', height: '100%', display: 'block', maxHeight: '88vh', objectFit: 'contain' }}
              />
              <div style={WATERMARK_STYLE} />

              {/* Ícono info esquina superior izquierda */}
              <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 20, width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                ⓘ
              </div>
            </div>

            {/* Columna panel info (fondo blanco) */}
            <div style={{ flex: '0 0 280px', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formatearTamano(fotoAmpliada.tamano_bytes) && (
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {formatearTamano(fotoAmpliada.tamano_bytes)}
                </p>
              )}
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Al momento de la compra se entrega sin marcas de agua
              </p>
              <button onClick={(e) => alternarSeleccion(fotoAmpliada, e)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: estaEnCarrito(fotoAmpliada.id) ? '#16a34a' : '#312e81', color: 'white', padding: '13px 22px', borderRadius: '50px', border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}>
                {estaEnCarrito(fotoAmpliada.id) ? <Check size={16} /> : <Plus size={16} />}
                {estaEnCarrito(fotoAmpliada.id) ? 'Añadida' : 'Añadir'}
              </button>
            </div>

            <button onClick={() => setFotoAmpliada(null)}
              style={{ position: 'absolute', top: '14px', right: '14px', width: '32px', height: '32px', backgroundColor: '#0f172a', border: 'none', borderRadius: '50%', fontSize: '15px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, color: 'white' }}>
              ✕
            </button>
          </div>

          {/* Flecha siguiente */}
          {fotos.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); navegarFoto(1); }}
              aria-label="Foto siguiente"
              style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 210, width: '44px', height: '44px', borderRadius: '50%', border: 'none', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.35)', fontSize: '18px' }}>
              →
            </button>
          )}
        </div>
      )}
    </div>
  );
}