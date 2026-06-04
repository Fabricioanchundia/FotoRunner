'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Calendar, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface Evento {
  id: string;
  nombre: string;
  ciudad: string;
  fecha: string;
  tipo: string;
  cover_url: string | null;
  status: string;
}

export default function Home() {
  const [busqueda, setBusqueda] = useState('');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const { data } = await api.get('/eventos');
        setEventos(data.datos);
      } catch {
        setEventos([]);
      } finally {
        setCargando(false);
      }
    };
    cargarEventos();
  }, []);

  const eventosFiltrados = eventos.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.ciudad.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'white' }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        backgroundColor: 'white', borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img
              src="/Logo.png"
              alt="FotoRunner"
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span style={{ fontWeight: 800, fontSize: '20px', color: '#111', letterSpacing: '2px' }}>
              FOTORUNNER
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/login" style={{
              color: '#555', fontSize: '14px', fontWeight: 600,
              padding: '8px 16px', borderRadius: '50px',
              textDecoration: 'none', transition: 'background 0.2s'
            }}>
              Iniciar sesión
            </Link>
            <Link href="/registro" style={{
              backgroundColor: '#FF6B00', color: 'white',
              fontSize: '14px', fontWeight: 700,
              padding: '9px 20px', borderRadius: '50px',
              textDecoration: 'none'
            }}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: '64px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #7c2d12 100%)',
          padding: '80px 24px'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <img
              src="/Logo.png"
              alt="FotoRunner"
              style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 16px', display: 'block' }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
              }}
            />
            <span style={{ fontSize: '52px', fontWeight: 900, color: 'white', letterSpacing: '6px', display: 'block', marginBottom: '8px' }}>
              FOTORUNNER
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
              Encuentra tus fotos
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px', fontSize: '15px' }}>
              Empieza a disfrutar de tus recuerdos deportivos
            </p>

            {/* Buscador */}
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{
                display: 'flex', gap: '8px', backgroundColor: 'white',
                borderRadius: '50px', padding: '6px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px' }}>
                  <Search size={18} color="#999" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Nombre del evento, ciudad..."
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      fontSize: '14px', color: '#111', width: '100%'
                    }}
                  />
                </div>
                <button style={{
                  backgroundColor: '#FF6B00', color: 'white', border: 'none',
                  borderRadius: '50px', padding: '12px 28px', fontSize: '14px',
                  fontWeight: 700, cursor: 'pointer'
                }}>
                  Buscar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EVENTOS */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111' }}>Galerías</h2>
          <span style={{ color: '#999', fontSize: '14px' }}>{eventosFiltrados.length} eventos</span>
        </div>

        {cargando ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <div style={{ backgroundColor: '#f0f0f0', borderRadius: '16px', aspectRatio: '4/3', marginBottom: '12px', animation: 'pulse 2s infinite' }} />
                <div style={{ backgroundColor: '#f0f0f0', height: '16px', borderRadius: '8px', marginBottom: '8px' }} />
                <div style={{ backgroundColor: '#f5f5f5', height: '12px', borderRadius: '8px', width: '60%' }} />
              </div>
            ))}
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
            <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No hay eventos disponibles</p>
            <p style={{ fontSize: '14px' }}>Los eventos aparecerán aquí cuando el admin los cree</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {eventosFiltrados.map((evento) => (
              <Link key={evento.id} href={`/eventos/${evento.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ cursor: 'pointer' }}>
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', aspectRatio: '4/3', marginBottom: '12px', backgroundColor: '#f0f0f0' }}>
                    {evento.cover_url ? (
                      <img src={evento.cover_url} alt={evento.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #1e293b, #7c2d12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Sin imagen</span>
                      </div>
                    )}
                    <span style={{
                      position: 'absolute', top: '10px', left: '10px',
                      backgroundColor: '#FF6B00', color: 'white',
                      fontSize: '11px', fontWeight: 700,
                      padding: '4px 10px', borderRadius: '50px'
                    }}>
                      {evento.tipo}
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 800, color: '#111', fontSize: '14px', lineHeight: 1.3, marginBottom: '6px' }}>
                    {evento.nombre}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#999', fontSize: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={11} /> {evento.ciudad}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={11} />
                      {new Date(evento.fecha).toLocaleDateString('es-EC')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #7c2d12)',
          borderRadius: '24px', padding: '48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
              ¿Apareces en alguna foto?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '420px', fontSize: '15px' }}>
              Regístrate y sube tu selfie — nuestro reconocimiento facial encuentra todas tus fotos automáticamente.
            </p>
          </div>
          <Link href="/registro" style={{
            backgroundColor: '#FF6B00', color: 'white',
            padding: '14px 28px', borderRadius: '50px',
            fontWeight: 700, fontSize: '15px', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'
          }}>
            Empezar gratis <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/Logo.png" alt="FR" style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ fontWeight: 800, fontSize: '18px', color: '#111', letterSpacing: '2px' }}>FOTORUNNER</span>
          </div>
          <p style={{ color: '#999', fontSize: '12px' }}>© 2026 FotoRunner.ec — Ecuador</p>
        </div>
      </footer>

    </main>
  );
}