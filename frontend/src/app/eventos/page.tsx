'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, ShoppingCart, Camera, ScanFace } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { contarItems } from '@/lib/carrito';

interface Evento {
  id: string;
  nombre: string;
  ciudad: string;
  fecha: string;
  tipo: string;
  cover_url: string | null;
  _count: { fotos: number };
}

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

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [logueado, setLogueado] = useState(false);
  const [itemsCarrito, setItemsCarrito] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLogueado(!!token);
    setItemsCarrito(contarItems());
  }, []);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get('/eventos');
        setEventos(data.datos);
      } catch {
        toast.error('Error al cargar los eventos');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', fontFamily: 'sans-serif' }}>

      {/* HEADER */}
      <header style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/Logo.png" alt="FR" style={{ width: '34px', height: '34px', objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', letterSpacing: '1px' }}>FOTORUNNER</span>
        </Link>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/carrito" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
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
              <Link href="/login" style={{ background: '#312e81', color: 'white', fontSize: '14px', fontWeight: 700, padding: '10px 22px', borderRadius: '50px', textDecoration: 'none' }}>
                Iniciar sesión
              </Link>
              <Link href="/registro" style={{ color: '#0f172a', fontSize: '14px', fontWeight: 700, padding: '10px 22px', borderRadius: '50px', textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </header>

      {/* HERO grande: misma estética que la página de evento. Aquí "Hacer
          selfie" no puede buscar fotos todavía (no se eligió un evento),
          así que en vez de abrir la cámara hace scroll hasta la lista de
          eventos para que el usuario elija uno primero. */}
      <div style={{ position: 'relative', height: '340px', overflow: 'hidden' }}>
        <img src={eventos[0]?.cover_url || "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1400&h=500&fit=crop"} alt="FotoRunner"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, width: '380px', backgroundColor: 'white', borderRadius: '20px', padding: '32px 28px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>Encuentra tus imágenes</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
            Elige tu evento para buscar tus fotos con tu rostro
          </p>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', borderRadius: '50%', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScanFace size={28} color="#94a3b8" />
          </div>
          <button onClick={() => document.getElementById('lista-eventos')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ width: '100%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Camera size={16} /> Hacer selfie
          </button>
        </div>
      </div>

      <div id="lista-eventos" style={{ maxWidth: '1320px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}>
          Álbumes Públicos
        </h1>

        {cargando ? (
          <p style={{ color: '#64748b' }}>Cargando eventos...</p>
        ) : eventos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Todavía no hay eventos publicados</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Vuelve más tarde para ver las próximas carreras</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {eventos.map((evento) => (
              <Link key={evento.id} href={`/eventos/${evento.id}`}
                style={{ textDecoration: 'none', color: 'inherit', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'block' }}>
                <div style={{ width: '100%', height: '160px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                  <img src={evento.cover_url || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=320&fit=crop'}
                    alt={evento.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    {evento.nombre}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                      <MapPin size={13} /> {evento.ciudad}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                      <Calendar size={13} /> {formatearFecha(evento.fecha)}
                    </span>
                  </div>
                  <p style={{ marginTop: '10px', color: '#94a3b8', fontSize: '12px' }}>
                    {evento._count?.fotos ?? 0} fotos
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}