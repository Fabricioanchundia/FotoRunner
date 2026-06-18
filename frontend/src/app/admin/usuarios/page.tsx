'use client';
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  phone: string | null;
  role: string;
  email_verified: boolean;
  created_at: string;
  _count: { ordenes: number; face_matches: number };
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    api.get('/admin/usuarios')
      .then(({ data }) => setUsuarios(data.datos))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const cambiarRol = async (id: string, roleActual: string) => {
    const nuevoRol = roleActual === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.patch(`/admin/usuarios/${id}/rol`, { role: nuevoRol });
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, role: nuevoRol } : u));
      toast.success(`Rol cambiado a ${nuevoRol}`);
    } catch {
      toast.error('Error al cambiar rol');
    }
  };

  const filtrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#16142a' }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: '#16142a' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '4px' }}>Panel admin</p>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800 }}>Usuarios registrados</h1>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>🔍</span>
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar usuario..."
              style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '14px', width: '200px' }} />
          </div>
        </div>

        <div style={{ backgroundColor: '#1d1a38', borderRadius: '16px', border: '1px solid rgba(165,180,252,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '16px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', flex: 2 }}>USUARIO</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', flex: 1 }}>COMPRAS</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', flex: 1 }}>FOTOS</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', flex: 1 }}>ROL</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', flex: 1 }}>ACCIÓN</span>
          </div>

          {cargando ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Cargando...</div>
          ) : filtrados.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No hay usuarios</div>
          ) : filtrados.map((u, i) => (
            <div key={u.id} style={{ padding: '16px 24px', borderBottom: i < filtrados.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{u.nombre.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>{u.nombre}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{u.email}</p>
                  </div>
                </div>
              </div>
              <span style={{ color: 'white', fontSize: '14px', flex: 1 }}>{u._count.ordenes}</span>
              <span style={{ color: 'white', fontSize: '14px', flex: 1 }}>{u._count.face_matches}</span>
              <div style={{ flex: 1 }}>
                <span style={{ backgroundColor: u.role === 'ADMIN' ? '#FF6B00' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px' }}>
                  {u.role}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <button onClick={() => cambiarRol(u.id, u.role)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {u.role === 'ADMIN' ? 'Quitar admin' : 'Hacer admin'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}