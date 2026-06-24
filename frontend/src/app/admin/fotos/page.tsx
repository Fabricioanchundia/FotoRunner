'use client';
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Trash2, Image, Calendar, MapPin, Search } from 'lucide-react';

interface Foto {
  id: string;
  gcs_original_url: string;
  gcs_watermark_url: string | null;
  created_at: string;
  processed_at: string | null;
  evento: { id: string; nombre: string; ciudad: string };
}

const SKELETON_KEYS = Array.from({ length: 12 }, (_, i) => `sk-${i}`);

export default function AdminFotosPage() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [fotoAmpliada, setFotoAmpliada] = useState<Foto | null>(null);

  useEffect(() => {
    cargarFotos();
  }, []);

  const cargarFotos = async () => {
    try {
      const { data } = await api.get('/admin/fotos');
      setFotos(data.datos);
    } catch {
      toast.error('Error al cargar fotos');
    } finally {
      setCargando(false);
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta foto? Esta acción no se puede deshacer.')) return;
    setEliminando(id);
    try {
      await api.delete(`/admin/fotos/${id}`);
      setFotos(prev => prev.filter(f => f.id !== id));
      toast.success('Foto eliminada');
      if (fotoAmpliada?.id === id) setFotoAmpliada(null);
    } catch {
      toast.error('Error al eliminar la foto');
    } finally {
      setEliminando(null);
    }
  };

  const filtradas = fotos.filter(f =>
    f.evento.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    f.evento.ciudad.toLowerCase().includes(busqueda.toLowerCase())
  );

  let contenidoGrid;
  if (cargando) {
    contenidoGrid = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {SKELETON_KEYS.map((key) => (
          <div key={key} style={{ backgroundColor: '#1d1a38', borderRadius: '14px', aspectRatio: '4/3' }} />
        ))}
      </div>
    );
  } else if (filtradas.length === 0) {
    contenidoGrid = (
      <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>
        <Image size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
        <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px', color: 'rgba(255,255,255,0.5)' }}>
          No hay fotos aún
        </p>
        <p style={{ fontSize: '14px' }}>
          Sube fotos desde el panel de galerías
        </p>
      </div>
    );
  } else {
    contenidoGrid = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {filtradas.map((foto) => (
          <div key={foto.id}
            style={{ backgroundColor: '#1d1a38', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(165,180,252,0.1)', transition: 'border-color 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(165,180,252,0.1)'; }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(165,180,252,0.1)'; }}>

            {/* Imagen */}
            <div
              role="button"
              tabIndex={0}
              style={{ position: 'relative', aspectRatio: '4/3', backgroundColor: '#0f172a', cursor: 'pointer' }}
              onClick={() => setFotoAmpliada(foto)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFotoAmpliada(foto); } }}>
              <img
                src={foto.gcs_watermark_url || foto.gcs_original_url}
                alt="foto"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x225?text=Sin+imagen';
                }}
              />
              {/* Badge procesado */}
              <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: foto.processed_at ? 'rgba(34,197,94,0.85)' : 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px' }}>
                {foto.processed_at ? '✓ Procesada' : '⏳ Pendiente'}
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: '12px 14px' }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '13px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {foto.evento.nombre}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={10} /> {foto.evento.ciudad}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={10} />
                  {new Date(foto.created_at).toLocaleDateString('es-EC')}
                </span>
              </div>

              {/* Botón eliminar */}
              <button
                onClick={() => eliminar(foto.id)}
                disabled={eliminando === foto.id}
                style={{ width: '100%', marginTop: '10px', backgroundColor: eliminando === foto.id ? '#334155' : 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '7px', color: '#f87171', fontSize: '12px', fontWeight: 700, cursor: eliminando === foto.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Trash2 size={13} />
                {eliminando === foto.id ? 'Eliminando...' : 'Eliminar foto'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#16142a' }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#16142a' }}>

        {/* TOPBAR */}
        <div style={{ backgroundColor: '#1d1a38', padding: '16px 28px', borderBottom: '1px solid rgba(165,180,252,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '2px' }}>Panel admin</p>
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 800 }}>Todas las fotos</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 14px' }}>
              <Search size={14} color="rgba(255,255,255,0.4)" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por evento..."
                style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '13px', width: '180px' }}
              />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.06)', padding: '8px 14px', borderRadius: '10px' }}>
              {filtradas.length} fotos
            </span>
          </div>
        </div>

        {/* GRID */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', backgroundColor: '#16142a' }}>
          {contenidoGrid}
        </div>
      </div>

      {/* MODAL FOTO AMPLIADA */}
      {fotoAmpliada && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setFotoAmpliada(null)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { setFotoAmpliada(null); } }}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div role="presentation" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', position: 'relative' }}>
            <img
              src={fotoAmpliada.gcs_watermark_url || fotoAmpliada.gcs_original_url}
              alt="Foto ampliada"
              style={{ width: '100%', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Error'; }}
            />
            <button onClick={() => setFotoAmpliada(null)}
              style={{ position: 'absolute', top: '-14px', right: '-14px', width: '36px', height: '36px', backgroundColor: 'white', border: 'none', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{fotoAmpliada.evento.nombre}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  {fotoAmpliada.evento.ciudad} · {new Date(fotoAmpliada.created_at).toLocaleDateString('es-EC')}
                </p>
              </div>
              <button
                onClick={() => eliminar(fotoAmpliada.id)}
                disabled={eliminando === fotoAmpliada.id}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                <Trash2 size={15} />
                {eliminando === fotoAmpliada.id ? 'Eliminando...' : 'Eliminar esta foto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}