'use client';
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import api from '@/lib/api';

interface Stats {
  totalUsuarios: number;
  totalEventos: number;
  totalFotos: number;
  totalOrdenes: number;
  ingresoTotal: number;
}

export default function AdminMonitorPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.datos))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const tarjetas = stats ? [
    { label: 'Usuarios registrados', valor: stats.totalUsuarios, emoji: '👥', color: '#3b82f6' },
    { label: 'Eventos creados', valor: stats.totalEventos, emoji: '🏃', color: '#FF6B00' },
    { label: 'Fotos subidas', valor: stats.totalFotos, emoji: '📸', color: '#8b5cf6' },
    { label: 'Ventas completadas', valor: stats.totalOrdenes, emoji: '🛒', color: '#22c55e' },
    { label: 'Ingresos totales', valor: `$${stats.ingresoTotal.toFixed(2)}`, emoji: '💰', color: '#f59e0b' },
  ] : [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#16142a' }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '32px', backgroundColor: '#16142a' }}>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '4px' }}>Panel admin</p>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800 }}>Mi monitor</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Estadísticas generales de FotoRunner</p>
        </div>

        {cargando ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ backgroundColor: '#1d1a38', borderRadius: '16px', height: '120px' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {tarjetas.map((t) => (
              <div key={t.label} style={{ backgroundColor: '#1d1a38', borderRadius: '16px', padding: '24px', border: '1px solid rgba(165,180,252,0.1)' }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>{t.emoji}</p>
                <p style={{ color: t.color, fontSize: '32px', fontWeight: 900, marginBottom: '4px' }}>{t.valor}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{t.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}