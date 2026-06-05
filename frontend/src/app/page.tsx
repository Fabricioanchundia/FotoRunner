'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Calendar, ChevronRight, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

interface Evento {
  id: string;
  nombre: string;
  ciudad: string;
  fecha: string;
  tipo: string;
  cover_url: string | null;
  status: string;
  _count: { fotos: number };
}

export default function Home() {
  const [busqueda, setBusqueda] = useState('');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/eventos')
      .then(({ data }) => setEventos(data.datos))
      .catch(() => setEventos([]))
      .finally(() => setCargando(false));
  }, []);

  const eventosFiltrados = eventos.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.ciudad.toLowerCase().includes(busqueda.toLowerCase())
  );

  const colorTipo = (tipo: string) => {
    if (tipo === 'RUNNING') return '#FF6B00';
    if (tipo === 'CICLISMO') return '#3b82f6';
    return '#8b5cf6';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', fontFamily: 'sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src="/Logo.png" alt="FotoRunner" style={{ width: '36px', height: '36px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ fontWeight: 800, fontSize: '20px', color: '#111', letterSpacing: '1px' }}>FOTORUNNER</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/login" style={{ color: '#555', fontSize: '14px', fontWeight: 600, padding: '8px 16px', textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
            <Link href="/registro" style={{ backgroundColor: '#FF6B00', color: 'white', fontSize: '14px', fontWeight: 700, padding: '9px 20px', borderRadius: '10px', textDecoration: 'none' }}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO — estilo original */}
      <section style={{ paddingTop: '64px' }}>
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #050d1a 0%, #0a1628 40%, #0d1f3c 70%, #1a0a2e 100%)',
          padding: '48px 32px 40px',
          overflow: 'hidden',
          minHeight: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Patrón geométrico fondo */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
            <img src="/hero-bg.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(5,13,26,0.9) 0%, rgba(10,22,40,0.7) 50%, rgba(26,10,46,0.8) 100%)' }} />
          </div>

          {/* Logo centrado arriba */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '32px' }}>
            <img src="/Logo.png" alt="FOTORUNNER"
              style={{ width: '52px', height: '52px', objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ color: 'white', fontWeight: 800, fontSize: '15px', letterSpacing: '4px' }}>FOTORUNNER</span>
          </div>

          {/* Contenido izquierda */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '900px' }}>
            <h1 style={{ fontSize: '40px', fontWeight: 900, color: 'white', marginBottom: '8px', lineHeight: 1.2 }}>
              Encuentra tus fotos
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', marginBottom: '24px' }}>
              Empieza a disfrutar de tus recuerdos deportivos
            </p>

            {/* Buscador */}
            <div style={{ display: 'flex', gap: '0', backgroundColor: 'white', borderRadius: '50px', overflow: 'hidden', maxWidth: '600px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '0 20px' }}>
                <Search size={18} color="#999" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Nombre del evento, ubicación..."
                  style={{ background: 'none', border: 'none', outline: 'none', fontSize: '14px', color: '#111', width: '100%', padding: '14px 0' }}
                />
              </div>
              <button style={{ backgroundColor: '#FF6B00', color: 'white', border: 'none', padding: '14px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', borderRadius: '0 50px 50px 0' }}>
                Buscar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* GALERÍAS */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111', marginBottom: '24px' }}>Galerías</h2>

        {cargando ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <div style={{ backgroundColor: '#f0f0f0', borderRadius: '16px', aspectRatio: '4/3', marginBottom: '12px' }} />
                <div style={{ backgroundColor: '#f0f0f0', height: '16px', borderRadius: '8px', marginBottom: '6px' }} />
                <div style={{ backgroundColor: '#f5f5f5', height: '12px', borderRadius: '8px', width: '50%' }} />
              </div>
            ))}
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#374151' }}>No hay eventos disponibles</p>
            <p style={{ fontSize: '14px' }}>Los eventos aparecerán aquí pronto</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {eventosFiltrados.map((evento) => (
              <Link key={evento.id} href={`/eventos/${evento.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}>
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', aspectRatio: '4/3', marginBottom: '12px', backgroundColor: '#f0f0f0' }}>
                    {evento.cover_url ? (
                      <img src={evento.cover_url} alt={evento.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e293b, #7c2d12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontWeight: 700 }}>SIN IMAGEN</span>
                      </div>
                    )}
                    <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: colorTipo(evento.tipo), color: 'white', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px' }}>
                      {evento.tipo}
                    </span>
                    {evento._count.fotos > 0 && (
                      <span style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '50px' }}>
                        {evento._count.fotos} fotos
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontWeight: 800, color: '#111', fontSize: '15px', lineHeight: 1.3, marginBottom: '4px' }}>
                    {evento.nombre}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', color: '#6b7280', fontSize: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={11} /> {evento.ciudad}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={11} />
                      {new Date(evento.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CÓMO FUNCIONA */}
      <section style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#FF6B00', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
            PLATAFORMA
          </p>
          <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 800, color: '#111', marginBottom: '12px' }}>
            ¿Cómo funciona?
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '15px', maxWidth: '480px', margin: '0 auto 48px', lineHeight: 1.7 }}>
            Encuentra tus fotos en segundos y llévate los mejores momentos de tu carrera
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              {
                numero: '01',
                titulo: 'Busca tu evento',
                descripcion: 'Ingresa el nombre de tu carrera o ciudad. Encontrarás todas las galerías fotográficas disponibles.'
              },
              {
                numero: '02',
                titulo: 'Visualiza tu galería',
                descripcion: 'Explora las fotos del evento de forma libre. Puedes ver todas las imágenes disponibles antes de decidir.'
              },
              {
                numero: '03',
                titulo: 'Adquiere tus fotos',
                descripcion: 'Elige las fotos donde apareces y descárgalas en alta resolución. Recuerda a cada corredor con la mejor calidad.'
              },
            ].map((paso) => (
              <div key={paso.numero} style={{ padding: '28px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span style={{ backgroundColor: '#FF6B00', color: 'white', fontSize: '13px', fontWeight: 900, width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {paso.numero}
                  </span>
                  <h3 style={{ fontWeight: 800, color: '#111', fontSize: '16px' }}>{paso.titulo}</h3>
                </div>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.7 }}>{paso.descripcion}</p>
              </div>
            ))}
          </div>

          {/* Beneficios */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '40px', flexWrap: 'wrap' }}>
            {[
              'Visualización gratuita de todas las fotos',
              'Descarga en alta resolución sin restricciones',
              'Pago seguro y descarga inmediata',
            ].map((b) => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#FF6B00" />
                <span style={{ color: '#374151', fontSize: '14px', fontWeight: 600 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 64px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0a0f1e 0%, #111827 60%, #1a0a2e 100%)',
          borderRadius: '24px', padding: '52px 48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '32px', flexWrap: 'wrap',
          border: '1px solid rgba(255,107,0,0.2)'
        }}>
          <div>
            <h2 style={{ fontSize: '30px', fontWeight: 900, color: 'white', marginBottom: '10px', lineHeight: 1.2 }}>
              ¿Corriste hoy?<br />
              <span style={{ color: '#FF6B00' }}>Tus fotos te están esperando</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '15px', maxWidth: '400px', lineHeight: 1.7 }}>
              Explora las galerías de tu evento, elige los mejores momentos y llévatelos en la mejor calidad disponible.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
            <Link href="/registro" style={{ backgroundColor: '#FF6B00', color: 'white', padding: '15px 32px', borderRadius: '12px', fontWeight: 800, fontSize: '16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Registrarme gratis <ChevronRight size={20} />
            </Link>
            <Link href="/login" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#0a0f1e', borderTop: '1px solid #1f2937', padding: '48px 24px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <img src="/Logo.png" alt="FR" style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span style={{ fontWeight: 800, fontSize: '18px', color: 'white', letterSpacing: '1px' }}>FOTORUNNER</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '13px', maxWidth: '240px', lineHeight: 1.7 }}>
                Plataforma de fotografía deportiva para corredores, ciclistas y atletas de Ecuador.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '56px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '13px', marginBottom: '16px' }}>Plataforma</p>
                {['Eventos', 'Cómo funciona', 'Precios', 'Para fotógrafos'].map(l => (
                  <p key={l} style={{ color: '#6b7280', fontSize: '13px', marginBottom: '10px', cursor: 'pointer' }}>{l}</p>
                ))}
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '13px', marginBottom: '16px' }}>Legal</p>
                {['Términos de uso', 'Privacidad', 'Contacto', 'Soporte'].map(l => (
                  <p key={l} style={{ color: '#6b7280', fontSize: '13px', marginBottom: '10px', cursor: 'pointer' }}>{l}</p>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1f2937', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <p style={{ color: '#4b5563', fontSize: '12px' }}>
              © 2026 FotoRunner.ec — Ecuador. Todos los derechos reservados.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p style={{ color: '#4b5563', fontSize: '12px' }}>Desarrollado por</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0d1b2e', border: '1px solid rgba(59,130,246,0.25)', padding: '6px 14px', borderRadius: '10px' }}>
                <img src="/nexora-logo.png" alt="Nexora Labs"
                  style={{ height: '22px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span style={{ color: 'white', fontWeight: 800, fontSize: '13px', letterSpacing: '2px' }}>NEXORA LABS</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}