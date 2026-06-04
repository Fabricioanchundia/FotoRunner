'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User, ShoppingBag, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cerrarSesion } from '@/lib/auth';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
}

interface Orden {
  id: string;
  total_usd: number;
  status: string;
  payment_method: string;
  created_at: string;
  evento: { nombre: string; ciudad: string };
}

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<'perfil' | 'ordenes'>('perfil');

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get('/auth/perfil');
        setUsuario(data.datos);
        const { data: dataOrdenes } = await api.get('/ordenes');
        setOrdenes(dataOrdenes.datos);
      } catch {
        router.push('/login');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [router]);

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <p style={{ color: '#999' }}>Cargando perfil...</p>
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #f0f0f0', padding: '12px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src="/Logo.png" alt="FR" style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ fontWeight: 800, fontSize: '18px', color: '#111', letterSpacing: '2px' }}>FOTORUNNER</span>
          </Link>
          <button onClick={cerrarSesion}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '50px', padding: '8px 16px', cursor: 'pointer', color: '#555', fontSize: '14px', fontWeight: 600 }}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

        {/* HEADER PERFIL */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {usuario.avatar_url ? (
              <img src={usuario.avatar_url} alt={usuario.nombre} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'white', fontSize: '28px', fontWeight: 800 }}>
                {usuario.nombre.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111', marginBottom: '4px' }}>{usuario.nombre}</h1>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>{usuario.email}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ backgroundColor: usuario.role === 'ADMIN' ? '#FF6B00' : '#f0f0f0', color: usuario.role === 'ADMIN' ? 'white' : '#555', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '50px' }}>
                {usuario.role === 'ADMIN' ? 'Administrador' : 'Corredor'}
              </span>
              {usuario.role === 'ADMIN' && (
                <Link href="/admin" style={{ backgroundColor: '#111', color: 'white', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', textDecoration: 'none' }}>
                  Panel Admin →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { key: 'perfil', label: 'Mi perfil', icon: <User size={16} /> },
            { key: 'ordenes', label: 'Mis compras', icon: <ShoppingBag size={16} /> },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as 'perfil' | 'ordenes')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: 700,
                backgroundColor: tab === t.key ? '#FF6B00' : 'white',
                color: tab === t.key ? 'white' : '#555',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* TAB: PERFIL */}
        {tab === 'perfil' && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', marginBottom: '24px' }}>Información personal</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {[
                { label: 'Nombre completo', value: usuario.nombre },
                { label: 'Email', value: usuario.email },
                { label: 'Teléfono', value: usuario.phone || 'No registrado' },
                { label: 'Miembro desde', value: new Date(usuario.created_at).toLocaleDateString('es-EC') },
              ].map((campo) => (
                <div key={campo.label}>
                  <p style={{ color: '#999', fontSize: '12px', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{campo.label}</p>
                  <p style={{ color: '#111', fontSize: '15px', fontWeight: 600 }}>{campo.value}</p>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '24px', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#FF6B00" /> Reconocimiento facial
              </h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                Sube tu selfie para que te encontremos automáticamente en las fotos de los eventos.
              </p>
              <button
                onClick={() => toast('Próximamente disponible')}
                style={{ backgroundColor: '#FF6B00', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                Subir mi selfie
              </button>
            </div>
          </div>
        )}

        {/* TAB: ORDENES */}
        {tab === 'ordenes' && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', marginBottom: '24px' }}>Mis compras</h2>
            {ordenes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#999' }}>
                <ShoppingBag size={48} color="#e5e7eb" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontWeight: 600, marginBottom: '8px' }}>Aún no tienes compras</p>
                <p style={{ fontSize: '14px' }}>Busca tu evento y adquiere tus fotos</p>
                <Link href="/" style={{ display: 'inline-block', marginTop: '16px', backgroundColor: '#FF6B00', color: 'white', padding: '10px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                  Ver eventos
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ordenes.map((orden) => (
                  <div key={orden.id} style={{ border: '1px solid #f0f0f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#111', marginBottom: '4px' }}>{orden.evento.nombre}</p>
                      <p style={{ color: '#999', fontSize: '13px' }}>{orden.evento.ciudad} · {new Date(orden.created_at).toLocaleDateString('es-EC')}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 800, color: '#FF6B00', fontSize: '18px' }}>${orden.total_usd}</p>
                      <span style={{
                        fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '50px',
                        backgroundColor: orden.status === 'PAGADO' ? '#dcfce7' : '#fef3c7',
                        color: orden.status === 'PAGADO' ? '#166534' : '#92400e'
                      }}>
                        {orden.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}