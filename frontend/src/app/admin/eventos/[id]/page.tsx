'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Trash2, ArrowLeft, Upload, MapPin, Calendar, Image } from 'lucide-react';

interface Evento {
  id: string;
  nombre: string;
  ciudad: string;
  fecha: string;
  tipo: string;
  status: string;
  cover_url: string | null;
  precio_individual: number;
  precio_photopass: number;
  _count: { fotos: number };
}

interface Foto {
  id: string;
  gcs_original_url: string;
  gcs_watermark_url: string | null;
  created_at: string;
  processed_at: string | null;
}

export default function AdminEventoFotosPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<Foto | null>(null);

  // Modal subir foto
  const [mostrarSubir, setMostrarSubir] = useState(false);
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState('');
  const [urlFoto, setUrlFoto] = useState('');
  const [urlWatermark, setUrlWatermark] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotosSubidas, setFotosSubidas] = useState(0);

  useEffect(() => { cargarTodo(); }, [id]);

  const cargarTodo = async () => {
    try {
      const [{ data: dataEvento }, { data: dataFotos }] = await Promise.all([
        api.get(`/eventos/${id}`),
        api.get(`/fotos/evento/${id}`)
      ]);
      setEvento(dataEvento.datos);
      setFotos(dataFotos.datos);
    } catch {
      toast.error('Error al cargar el evento');
      router.push('/admin');
    } finally {
      setCargando(false);
    }
  };

  const eliminar = async (fotoId: string) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    setEliminando(fotoId);
    try {
      await api.delete(`/admin/fotos/${fotoId}`);
      setFotos(prev => prev.filter(f => f.id !== fotoId));
      if (fotoAmpliada?.id === fotoId) setFotoAmpliada(null);
      toast.success('Foto eliminada');
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  const manejarArchivo = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Máximo 10MB'); return; }
    setArchivoFoto(file);
    setPreviewFoto(URL.createObjectURL(file));
    setUrlFoto('');
    setUrlWatermark('');
  };

  const cerrarModal = () => {
    setMostrarSubir(false);
    setArchivoFoto(null);
    setPreviewFoto('');
    setUrlFoto('');
    setUrlWatermark('');
  };

  const subirFoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubiendoFoto(true);
    try {
      let urlFinal = urlFoto;
      let urlWatermarkFinal = urlWatermark;

      if (archivoFoto) {
        const formData = new FormData();
        formData.append('foto', archivoFoto);
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3001/api/upload/foto', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (!data.exito) throw new Error(data.mensaje);
        urlFinal = data.datos.url;
        urlWatermarkFinal = data.datos.url_watermark;
      }

      if (!urlFinal) { toast.error('Selecciona foto o URL'); setSubiendoFoto(false); return; }

      await api.post('/fotos', {
        event_id: id,
        gcs_original_url: urlFinal,
        ...(urlWatermarkFinal && { gcs_watermark_url: urlWatermarkFinal })
      });

      setFotosSubidas(prev => prev + 1);
      setArchivoFoto(null);
      setPreviewFoto('');
      setUrlFoto('');
      setUrlWatermark('');
      toast.success('¡Foto subida con marca de agua!');
      cargarTodo();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { mensaje?: string } } };
      toast.error(error.response?.data?.mensaje || 'Error al subir foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#16142a' }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>
      </div>
    </div>
  );

  if (!evento) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#16142a' }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#16142a' }}>

        {/* TOPBAR */}
        <div style={{ backgroundColor: '#1d1a38', padding: '16px 28px', borderBottom: '1px solid rgba(165,180,252,0.1)' }}>
          <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '13px', marginBottom: '12px' }}>
            <ArrowLeft size={14} /> Volver a galerías
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{evento.nombre}</h1>
              <div style={{ display: 'flex', gap: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {evento.ciudad}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(evento.fecha).toLocaleDateString('es-EC')}</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{fotos.length} fotos</span>
                {fotosSubidas > 0 && <span style={{ color: '#4ade80', fontWeight: 700 }}>+{fotosSubidas} subidas hoy</span>}
              </div>
            </div>
            <button onClick={() => setMostrarSubir(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              <Upload size={16} /> Subir fotos
            </button>
          </div>
        </div>

        {/* GRID FOTOS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', backgroundColor: '#16142a' }}>
          {fotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>
              <Image size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px', color: 'rgba(255,255,255,0.5)' }}>No hay fotos</p>
              <button onClick={() => setMostrarSubir(true)}
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '16px' }}>
                + Subir primera foto
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {fotos.map((foto) => (
                <div key={foto.id} style={{ backgroundColor: '#1d1a38', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(165,180,252,0.1)' }}>
                  <button
                    type="button"
                    style={{ width: '100%', padding: 0, border: 'none', font: 'inherit', color: 'inherit', position: 'relative', aspectRatio: '4/3', cursor: 'pointer' }}
                    onClick={() => setFotoAmpliada(foto)}>
                    <img
                      src={foto.gcs_watermark_url || foto.gcs_original_url}
                      alt="foto"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: foto.processed_at ? 'rgba(34,197,94,0.85)' : 'rgba(0,0,0,0.65)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '50px' }}>
                      {foto.processed_at ? '✓ Procesada' : '⏳'}
                    </div>
                    {foto.gcs_watermark_url && (
                      <div style={{ position: 'absolute', bottom: '6px', left: '6px', backgroundColor: 'rgba(14,165,233,0.8)', color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '50px' }}>
                        🔒 WM
                      </div>
                    )}
                  </button>
                  <div style={{ padding: '10px 12px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '8px' }}>
                      {new Date(foto.created_at).toLocaleDateString('es-EC')}
                    </p>
                    <button onClick={() => eliminar(foto.id)} disabled={eliminando === foto.id}
                      style={{ width: '100%', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '6px', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <Trash2 size={12} />
                      {eliminando === foto.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL SUBIR FOTO */}
      {mostrarSubir && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800 }}>Subir foto</h2>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <div style={{ backgroundColor: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '8px', padding: '8px 12px', marginBottom: '16px' }}>
              <p style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>
                🔒 La marca de agua se genera automáticamente
              </p>
            </div>
            <form onSubmit={subirFoto}>
              <input id="inputFotoEvento" type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) manejarArchivo(f); }} />
              <button
                type="button"
                onClick={() => document.getElementById('inputFotoEvento')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) manejarArchivo(f); }}
                style={{ width: '100%', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '14px', padding: '28px', textAlign: 'center', cursor: 'pointer', marginBottom: '16px', backgroundColor: 'rgba(255,255,255,0.02)', font: 'inherit', color: 'inherit' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                {previewFoto ? (
                  <img src={previewFoto} alt="preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px' }} />
                ) : (
                  <>
                    <Upload size={28} color="rgba(255,255,255,0.3)" style={{ margin: '0 auto 10px', display: 'block' }} />
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Arrastra aquí o clic</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>JPG, PNG, WEBP · máx 10MB</p>
                  </>
                )}
              </button>

              {archivoFoto && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>📁 {archivoFoto.name}</span>
                  <button type="button" onClick={() => { setArchivoFoto(null); setPreviewFoto(''); setUrlWatermark(''); }}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>o ingresa URL</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
              </div>

              <input type="url" value={urlFoto}
                onChange={(e) => { setUrlFoto(e.target.value); if (e.target.value) { setArchivoFoto(null); setPreviewFoto(''); } }}
                placeholder="https://..."
                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }} />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={cerrarModal}
                  style={{ flex: 1, border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={subiendoFoto || (!archivoFoto && !urlFoto)}
                  style={{ flex: 1, background: subiendoFoto || (!archivoFoto && !urlFoto) ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  {subiendoFoto ? 'Subiendo...' : '+ Subir foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOTO AMPLIADA */}
      {fotoAmpliada && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <button
            type="button"
            aria-label="Cerrar vista previa"
            onClick={() => setFotoAmpliada(null)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', padding: 0, backgroundColor: 'rgba(0,0,0,0.92)', cursor: 'pointer' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', width: '100%' }}>
            <img src={fotoAmpliada.gcs_watermark_url || fotoAmpliada.gcs_original_url}
              alt="Foto ampliada" style={{ width: '100%', borderRadius: '16px' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <button onClick={() => setFotoAmpliada(null)}
              style={{ position: 'absolute', top: '-14px', right: '-14px', width: '36px', height: '36px', backgroundColor: 'white', border: 'none', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => eliminar(fotoAmpliada.id)} disabled={eliminando === fotoAmpliada.id}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                <Trash2 size={15} />
                {eliminando === fotoAmpliada.id ? 'Eliminando...' : 'Eliminar foto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}