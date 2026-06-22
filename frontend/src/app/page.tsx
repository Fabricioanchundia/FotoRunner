'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Calendar, ChevronRight, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';

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
  const [logueado, setLogueado] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLogueado(!!token);
  }, []);

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
    if (tipo === 'RUNNING') return '#0ea5e9';
    if (tipo === 'CICLISMO') return '#6366f1';
    return '#8b5cf6';
  };

  if (cargando) {
    return <LoadingScreen variant="cliente" />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', fontFamily: 'sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/Logo.png" alt="FotoRunner"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '20px', color: '#0f172a', letterSpacing: '1px' }}>FOTORUNNER</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {logueado ? (
              <Link href="/perfil" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', fontSize: '14px', fontWeight: 700, padding: '9px 20px', borderRadius: '10px', textDecoration: 'none' }}>
                Mi perfil
              </Link>
            ) : (
              <>
                <Link href="/login" style={{ color: '#555', fontSize: '14px', fontWeight: 600, padding: '8px 16px', textDecoration: 'none' }}>
                  Iniciar sesión
                </Link>
                <Link href="/registro" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', fontSize: '14px', fontWeight: 700, padding: '9px 20px', borderRadius: '10px', textDecoration: 'none' }}>
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: '64px' }}>
        <div style={{ position: 'relative', minHeight: '360px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
          <img
            src="/hero-bg.png"
            alt="hero"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(2,6,23,0.92) 0%, rgba(7,15,40,0.85) 50%, rgba(15,10,50,0.88) 100%)' }} />

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%', maxWidth: '700px' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
              <img src="/Logo.png" alt="FR"
                style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: 900, color: 'white', marginBottom: '10px', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
              Encuentra tus fotos
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '17px', marginBottom: '32px' }}>
              Empieza a disfrutar de tus recuerdos deportivos
            </p>

            <div style={{ display: 'flex', gap: '0', backgroundColor: 'white', borderRadius: '50px', overflow: 'hidden', maxWidth: '580px', margin: '0 auto', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '0 20px' }}>
                <Search size={18} color="#94a3b8" />
                <input
                  type="text" value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Nombre del evento, ubicación..."
                  style={{ background: 'none', border: 'none', outline: 'none', fontSize: '14px', color: '#0f172a', width: '100%', padding: '15px 0' }}
                />
              </div>
              <button style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', padding: '15px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', borderRadius: '0 50px 50px 0', whiteSpace: 'nowrap' }}>
                Buscar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* GALERÍAS */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Galerías</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Encuentra tu carrera y descarga tus fotos</p>
          </div>
          <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '13px', fontWeight: 600, padding: '6px 14px', borderRadius: '50px' }}>
            {eventosFiltrados.length} eventos
          </span>
        </div>

        {cargando ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <div style={{ backgroundColor: '#f1f5f9', borderRadius: '16px', aspectRatio: '4/3', marginBottom: '12px' }} />
                <div style={{ backgroundColor: '#f1f5f9', height: '16px', borderRadius: '8px', marginBottom: '6px' }} />
                <div style={{ backgroundColor: '#f8fafc', height: '12px', borderRadius: '8px', width: '50%' }} />
              </div>
            ))}
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#475569' }}>No hay eventos disponibles</p>
            <p style={{ fontSize: '14px' }}>Los eventos aparecerán aquí pronto</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {eventosFiltrados.map((evento) => (
              <Link key={evento.id} href={`/eventos/${evento.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(14,165,233,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  }}>
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', aspectRatio: '4/3', marginBottom: '12px', backgroundColor: '#f1f5f9' }}>
                    {evento.cover_url ? (
                      <img src={evento.cover_url} alt={evento.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: 700 }}>SIN IMAGEN</span>
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
                  <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px', lineHeight: 1.3, marginBottom: '4px' }}>
                    {evento.nombre}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', color: '#94a3b8', fontSize: '12px' }}>
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
      <section style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#0ea5e9', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
            PLATAFORMA
          </p>
          <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            ¿Cómo funciona?
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '15px', maxWidth: '480px', margin: '0 auto 48px', lineHeight: 1.7 }}>
            Encuentra tus fotos en segundos y llévate los mejores momentos de tu carrera
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { numero: '01', titulo: 'Busca tu evento', descripcion: 'Ingresa el nombre de tu carrera o ciudad. Encontrarás todas las galerías fotográficas disponibles.' },
              { numero: '02', titulo: 'Visualiza tu galería', descripcion: 'Explora las fotos del evento de forma libre. Puedes ver todas las imágenes disponibles antes de decidir.' },
              { numero: '03', titulo: 'Adquiere tus fotos', descripcion: 'Elige las fotos donde apareces y descárgalas en alta resolución. Recuerda cada momento con la mejor calidad.' },
            ].map((paso) => (
              <div key={paso.numero} style={{ padding: '28px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', fontSize: '13px', fontWeight: 900, width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {paso.numero}
                  </span>
                  <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '16px' }}>{paso.titulo}</h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>{paso.descripcion}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '36px', flexWrap: 'wrap' }}>
            {['Visualización gratuita de todas las fotos', 'Descarga en alta resolución', 'Pago seguro y descarga inmediata'].map((b) => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#0ea5e9" />
                <span style={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 64px' }}>
        <div style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #1a0a2e 100%)', borderRadius: '24px', padding: '52px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap', border: '1px solid rgba(14,165,233,0.15)' }}>
          <div>
            <h2 style={{ fontSize: '30px', fontWeight: 900, color: 'white', marginBottom: '10px', lineHeight: 1.2 }}>
              ¿Corriste hoy?<br />
              <span style={{ background: 'linear-gradient(135deg, #0ea5e9, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Tus fotos te están esperando
              </span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', maxWidth: '400px', lineHeight: 1.7 }}>
              Explora las galerías de tu evento, elige los mejores momentos y llévatelos en la mejor calidad disponible.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
            {logueado ? (
              <Link href="/perfil" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', padding: '15px 32px', borderRadius: '12px', fontWeight: 800, fontSize: '16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Ver mis fotos <ChevronRight size={20} />
              </Link>
            ) : (
              <>
                <Link href="/registro" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', padding: '15px 32px', borderRadius: '12px', fontWeight: 800, fontSize: '16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Registrarme gratis <ChevronRight size={20} />
                </Link>
                <Link href="/login" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#020617', borderTop: '1px solid #1e293b', padding: '48px 24px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/Logo.png" alt="FR" style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '18px', color: 'white', letterSpacing: '1px' }}>FOTORUNNER</span>
              </div>
              <p style={{ color: '#475569', fontSize: '13px', maxWidth: '240px', lineHeight: 1.7 }}>
                Plataforma de fotografía deportiva para corredores, ciclistas y atletas de Ecuador.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '56px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '13px', marginBottom: '16px' }}>Plataforma</p>
                {['Eventos', 'Cómo funciona', 'Precios', 'Para fotógrafos'].map(l => (
                  <p key={l} style={{ color: '#475569', fontSize: '13px', marginBottom: '10px', cursor: 'pointer' }}>{l}</p>
                ))}
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '13px', marginBottom: '16px' }}>Legal</p>
                {['Términos de uso', 'Privacidad', 'Contacto', 'Soporte'].map(l => (
                  <p key={l} style={{ color: '#475569', fontSize: '13px', marginBottom: '10px', cursor: 'pointer' }}>{l}</p>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <p style={{ color: '#334155', fontSize: '12px' }}>
              © 2026 FotoRunner.ec — Ecuador. Todos los derechos reservados.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p style={{ color: '#334155', fontSize: '12px' }}>Desarrollado por</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0d1b2e', border: '1px solid rgba(14,165,233,0.25)', padding: '6px 14px', borderRadius: '10px' }}>
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