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
    <div style={{ width: '240px', backgroundColor: '#1e293b', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/Logo.png" alt="FR" style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'white', letterSpacing: '2px' }}>FOTORUNNER</span>
        </Link>
      </div>

      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '10px',
                backgroundColor: active ? '#FF6B00' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.5)',
                fontSize: '14px', fontWeight: active ? 700 : 500,
                marginBottom: '4px', cursor: 'pointer',
              }}>
                {item.icon} {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={cerrarSesion}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 500 }}>
          <LogOut size={18} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}