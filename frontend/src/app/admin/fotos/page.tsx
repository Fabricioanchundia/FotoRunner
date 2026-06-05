'use client';
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Foto {
  id: string;
  gcs_original_url: string;
  gcs_watermark_url: string | null;
  created_at: string;
  evento: { id: string; nombre: string; ciudad: string };
}

export default function AdminFotosPage() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/fotos')
      .then(({ data }) => setFotos(data.datos))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    setEliminando(id);
    try {
      await api.delete(`/admin/fotos/${id}`);
      setFotos(prev => prev.filter(f => f.id !== id));
      toast.success('Foto eliminada');
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#0f172a' }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '4px' }}>Panel admin</p>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800 }}>Todas las fotos</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>{fotos.length} fotos en total</p>
        </div>

        {cargando ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{ backgroundColor: '#1e293b', borderRadius: '12px', aspectRatio: '3/2' }} />
            ))}
          </div>
        ) : fotos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📸</p>
            <p style={{ fontWeight: 700, fontSize: '18px' }}>No hay fotos aún</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Sube fotos desde el panel de galerías</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {fotos.map((foto) => (
              <div key={foto.id} style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ position: 'relative', aspectRatio: '3/2' }}>
                  <img src={foto.gcs_original_url} alt="foto"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x133?text=Error'; }} />
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    📍 {foto.evento.nombre}
                  </p>
                  <button onClick={() => eliminar(foto.id)} disabled={eliminando === foto.id}
                    style={{ width: '100%', backgroundColor: eliminando === foto.id ? '#444' : 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '6px', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    {eliminando === foto.id ? 'Eliminando...' : '🗑 Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}