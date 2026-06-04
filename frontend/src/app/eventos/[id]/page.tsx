'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, Calendar, ArrowLeft, Lock, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Evento {
  id: string;
  nombre: string;
  ciudad: string;
  fecha: string;
  tipo: string;
  descripcion: string | null;
  cover_url: string | null;
  status: string;
  admin: { nombre: string };
  _count: { fotos: number };
}

interface Foto {
  id: string;
  gcs_original_url: string;
  gcs_watermark_url: string | null;
}

export default function EventoPage() {
  const params = useParams();
  const id = params.id as string;
  const [evento, setEvento] = useState<Evento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get(`/eventos/${id}`);
        setEvento(data.datos);
        const { data: dataFotos } = await api.get(`/fotos/evento/${id}`);
        setFotos(dataFotos.datos);
      } catch {
        toast.error('Error al cargar el evento');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#999' }}>Cargando evento...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#999' }}>Evento no encontrado</p>
      </div>
    );
  }

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
          <Link href="/login" style={{ backgroundColor: '#FF6B00', color: 'white', padding: '8px 20px', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
            Iniciar sesión
          </Link>
        </div>
      </nav>

      {/* HEADER EVENTO */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#666', textDecoration: 'none', fontSize: '14px', marginBottom: '20px' }}>
            <ArrowLeft size={16} /> Volver a eventos
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
            {evento.cover_url && (
              <img src={evento.cover_url} alt={evento.nombre}
                style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
            )}
            <div>
              <span style={{ backgroundColor: '#FF6B00', color: 'white', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px', display: 'inline-block', marginBottom: '8px' }}>
                {evento.tipo}
              </span>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111', marginBottom: '8px' }}>{evento.nombre}</h1>
              <div style={{ display: 'flex', gap: '16px', color: '#666', fontSize: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} /> {evento.ciudad}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {new Date(evento.fecha).toLocaleDateString('es-EC')}
                </span>
                <span style={{ fontWeight: 600 }}>{evento._count.fotos} fotos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GALERÍA */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>

        {fotos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>
            <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No hay fotos aún</p>
            <p style={{ fontSize: '14px' }}>El fotógrafo subirá las fotos pronto</p>
          </div>
        ) : (
          <>
            {/* Banner reconocimiento facial */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #7c2d12)', borderRadius: '16px', padding: '24px 32px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <p style={{ color: 'white', fontWeight: 800, fontSize: '18px', marginBottom: '4px' }}>¿Apareces en estas fotos?</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Regístrate y te encontramos automáticamente</p>
              </div>
              <Link href="/registro" style={{ backgroundColor: '#FF6B00', color: 'white', padding: '12px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap' }}>
                Buscar mis fotos
              </Link>
            </div>

            {/* Grid de fotos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {fotos.map((foto) => (
                <div key={foto.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '3/2', backgroundColor: '#f0f0f0', cursor: 'pointer' }}>
                  <img
                    src={foto.gcs_watermark_url || foto.gcs_original_url}
                    alt="Foto del evento"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Overlay con botón */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.4)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0)'; }}>
                    <button
                      onClick={() => toast('Inicia sesión para comprar esta foto')}
                      style={{ backgroundColor: 'white', border: 'none', borderRadius: '50px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                    >
                      <Lock size={14} /> Comprar
                    </button>
                  </div>
                  {/* Badge marca de agua */}
                  {foto.gcs_watermark_url && (
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={10} /> Preview
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}