'use client';
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Evento {
  id: string;
  nombre: string;
  status: string;
  ciudad: string;
}

export default function AdminConfiguracionPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);

  useEffect(() => {
    api.get('/eventos')
      .then(({ data }) => setEventos(data.datos))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const cambiarStatus = async (id: string, status: string) => {
    setActualizando(id);
    try {
      await api.patch(`/admin/eventos/${id}/status`, { status });
      setEventos(prev => prev.map(e => e.id === id ? { ...e, status } : e));
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setActualizando(null);
    }
  };

  const colorStatus = (s: string) => {
    if (s === 'ACTIVO') return '#22c55e';
    if (s === 'PROXIMO') return '#3b82f6';
    return '#6b7280';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#0f172a' }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '4px' }}>Panel admin</p>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800 }}>Configuración</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Gestiona el estado de tus eventos</p>
        </div>

        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 700 }}>Estado de eventos</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
              Cambia el estado de cada evento — PRÓXIMO, ACTIVO o COMPLETADO
            </p>
          </div>

          {cargando ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Cargando...</div>
          ) : eventos.map((evento, i) => (
            <div key={evento.id} style={{ padding: '16px 24px', borderBottom: i < eventos.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <p style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>{evento.nombre}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{evento.ciudad}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ backgroundColor: colorStatus(evento.status), color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '50px' }}>
                  {evento.status}
                </span>
                <select
                  value={evento.status}
                  onChange={(e) => cambiarStatus(evento.id, e.target.value)}
                  disabled={actualizando === evento.id}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 10px', color: 'white', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
                  <option value="PROXIMO">PRÓXIMO</option>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="COMPLETADO">COMPLETADO</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}