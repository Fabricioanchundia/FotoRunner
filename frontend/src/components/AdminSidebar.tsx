'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Camera, Users, Filter, Image, Settings, LogOut } from 'lucide-react';
import { cerrarSesion } from '@/lib/auth';

const items = [
  { icon: <LayoutDashboard size={18} />, label: 'Mis galerías', href: '/admin' },
  { icon: <Camera size={18} />, label: 'Fotos', href: '/admin/fotos' },
  { icon: <Users size={18} />, label: 'Usuarios', href: '/admin/usuarios' },
  { icon: <Filter size={18} />, label: 'Facial cloud', href: '/admin/facial' },
  { icon: <Image size={18} />, label: 'Mi monitor', href: '/admin/monitor' },
  { icon: <Settings size={18} />, label: 'Configuración', href: '/admin/configuracion' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div style={{
      width: '252px', flexShrink: 0, minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      backgroundColor: '#221f42',
      borderRight: '1px solid rgba(129,140,248,0.18)',
    }}>
      <div style={{ padding: '26px 22px 22px', borderBottom: '1px solid rgba(165,180,252,0.15)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '11px', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            backgroundColor: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)', flexShrink: 0,
          }}>
            <img src="/Logo.png" alt="FR" style={{ width: '24px', height: '24px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '15px', color: 'white', letterSpacing: '1.5px' }}>FOTORUNNER</span>
        </Link>
        <p style={{ marginTop: '14px', marginBottom: 0, fontSize: '10px', fontWeight: 700, color: '#c7d2fe', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          Panel administrador
        </p>
      </div>

      <nav style={{ padding: '18px 14px', flex: 1 }}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '10px',
                background: active ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
                color: active ? 'white' : '#c7d2fe',
                fontSize: '14px', fontWeight: active ? 700 : 500,
                marginBottom: '3px', cursor: 'pointer',
                boxShadow: active ? '0 4px 14px rgba(79,70,229,0.4)' : 'none',
                transition: 'background-color 0.15s, color 0.15s',
              }}>
                <span style={{ display: 'flex', color: active ? 'white' : '#a5b4fc' }}>
                  {item.icon}
                </span>
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '14px', borderTop: '1px solid rgba(165,180,252,0.15)' }}>
        <button onClick={cerrarSesion}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: '#a5b4fc', fontSize: '14px', fontWeight: 500 }}>
          <LogOut size={18} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}