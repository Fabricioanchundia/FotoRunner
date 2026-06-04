'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, MapPin, Image, LogOut, LayoutDashboard, Camera, Users, Settings, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cerrarSesion } from '@/lib/auth';

interface Evento {
  id: string;
  nombre: string;
  ciudad: string;
  fecha: string;
  tipo: string;
  status: string;
  cover_url: string | null;
  _count: { fotos: number };
}

export default function AdminPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [creando, setCreando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [form, setForm] = useState({
    nombre: '', ciudad: '', fecha: '',
    tipo: 'RUNNING', descripcion: '', cover_url: ''
  });

  useEffect(() => { cargarEventos(); }, []);

  const cargarEventos = async () => {
    try {
      const { data } = await api.get('/eventos');
      setEventos(data.datos);
    } catch {
      router.push('/login');
    } finally {
      setCargando(false);
    }
  };

  const crearEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    try {
      await api.post('/eventos', { ...form, fecha: new Date(form.fecha).toISOString() });
      toast.success('Evento creado exitosamente');
      setMostrarForm(false);
      setForm({ nombre: '', ciudad: '', fecha: '', tipo: 'RUNNING', descripcion: '', cover_url: '' });
      cargarEventos();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { mensaje?: string } } };
      toast.error(error.response?.data?.mensaje || 'Error al crear evento');
    } finally {
      setCreando(false);
    }
  };

  const eventosFiltrados = eventos.filter(e => {
    const matchBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase()) || e.ciudad.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo === 'TODOS' || e.tipo === filtroTipo;
    const matchStatus = filtroStatus === 'TODOS' || e.status === filtroStatus;
    return matchBusqueda && matchTipo && matchStatus;
  });

  const colorStatus = (status: string) => {
    if (status === 'ACTIVO') return { backgroundColor: '#22c55e', color: 'white' };
    if (status === 'PROXIMO') return { backgroundColor: '#3b82f6', color: 'white' };
    return { backgroundColor: '#6b7280', color: 'white' };
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#0f172a' }}>

      {/* SIDEBAR */}
      <div style={{ width: '240px', backgroundColor: '#1e293b', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src="/Logo.png" alt="FR" style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ fontWeight: 800, fontSize: '16px', color: 'white', letterSpacing: '2px' }}>FOTORUNNER</span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {[
            { icon: <LayoutDashboard size={18} />, label: 'Mis galerías', active: true },
            { icon: <Camera size={18} />, label: 'Fotos', active: false },
            { icon: <Users size={18} />, label: 'Usuarios registrados', active: false },
            { icon: <Filter size={18} />, label: 'Facial cloud', active: false },
            { icon: <Image size={18} />, label: 'Mi monitor', active: false },
            { icon: <Settings size={18} />, label: 'Configuración', active: false },
          ].map((item) => (
            <button key={item.label}
              onClick={() => item.active ? null : toast('Próximamente')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                backgroundColor: item.active ? '#FF6B00' : 'transparent',
                color: item.active ? 'white' : 'rgba(255,255,255,0.5)',
                fontSize: '14px', fontWeight: item.active ? 700 : 500,
                marginBottom: '4px', textAlign: 'left',
              }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* Cerrar sesión */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={cerrarSesion}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 500 }}>
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <div style={{ backgroundColor: '#1e293b', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '2px' }}>Panel admin</p>
            <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 800 }}>Mis galerías</h1>
          </div>
          <button onClick={() => setMostrarForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FF6B00', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16} /> Crear galería
          </button>
        </div>

        {/* FILTROS */}
        <div style={{ backgroundColor: '#1e293b', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} /> Filtros
          </span>

          {/* Buscador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px' }}>
            <Search size={14} color="rgba(255,255,255,0.4)" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre de la galería..."
              style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '13px', width: '180px' }} />
          </div>

          {/* Tipo */}
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
            <option value="TODOS">Todos los tipos</option>
            <option value="RUNNING">Running</option>
            <option value="ATLETISMO">Atletismo</option>
            <option value="CICLISMO">Ciclismo</option>
          </select>

          {/* Status */}
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
            <option value="TODOS">Todos los estados</option>
            <option value="PROXIMO">Próximo</option>
            <option value="ACTIVO">Activo</option>
            <option value="COMPLETADO">Completado</option>
          </select>

          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: 'auto' }}>
            {eventosFiltrados.length} de {eventos.length} galerías
          </span>
        </div>

        {/* GRID GALERÍAS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {cargando ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ backgroundColor: '#1e293b', borderRadius: '16px', aspectRatio: '16/10', animation: 'pulse 2s infinite' }} />
              ))}
            </div>
          ) : eventosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>
              <Image size={64} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>No hay galerías</p>
              <p style={{ fontSize: '14px' }}>Crea tu primera galería de fotos</p>
              <button onClick={() => setMostrarForm(true)}
                style={{ marginTop: '20px', backgroundColor: '#FF6B00', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                + Crear galería
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {eventosFiltrados.map((evento) => (
                <div key={evento.id} style={{ backgroundColor: '#1e293b', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>

                  {/* Foto portada */}
                  <div style={{ position: 'relative', aspectRatio: '16/10', backgroundColor: '#0f172a', overflow: 'hidden' }}>
                    {evento.cover_url ? (
                      <img src={evento.cover_url} alt={evento.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e3a5f, #7c2d12)' }}>
                        <Image size={40} color="rgba(255,255,255,0.2)" />
                      </div>
                    )}
                    {/* Status badge */}
                    <span style={{ position: 'absolute', top: '10px', right: '10px', ...colorStatus(evento.status), fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px' }}>
                      {evento.status}
                    </span>
                    {/* Tipo badge */}
                    <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px' }}>
                      {evento.tipo}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ color: 'white', fontWeight: 800, fontSize: '15px', marginBottom: '8px', lineHeight: 1.3 }}>
                      {evento.nombre}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={11} /> {evento.ciudad}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} /> {new Date(evento.fecha).toLocaleDateString('es-EC')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Image size={12} /> {evento._count.fotos} fotos
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/eventos/${evento.id}`}
                          style={{ padding: '6px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', textDecoration: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>
                          Ver
                        </Link>
                        <button onClick={() => toast('Subida de fotos próximamente')}
                          style={{ padding: '6px 12px', backgroundColor: '#FF6B00', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                          + Fotos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR EVENTO */}
      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '24px' }}>Crear nueva galería</h2>
            <form onSubmit={crearEvento}>
              {[
                { label: 'Nombre del evento', key: 'nombre', type: 'text', placeholder: 'Half Marathon Manta 2026' },
                { label: 'Ciudad', key: 'ciudad', type: 'text', placeholder: 'Manta' },
                { label: 'Fecha del evento', key: 'fecha', type: 'datetime-local', placeholder: '' },
                { label: 'URL de portada (opcional)', key: 'cover_url', type: 'url', placeholder: 'https://...' },
              ].map((campo) => (
                <div key={campo.key} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{campo.label}</label>
                  <input type={campo.type} required={campo.key !== 'cover_url'}
                    value={form[campo.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [campo.key]: e.target.value })}
                    placeholder={campo.placeholder}
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Tipo de evento</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="RUNNING">Running</option>
                  <option value="ATLETISMO">Atletismo</option>
                  <option value="CICLISMO">Ciclismo</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Descripción (opcional)</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción del evento..." rows={3}
                  style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setMostrarForm(false)}
                  style={{ flex: 1, border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={creando}
                  style={{ flex: 1, backgroundColor: creando ? '#666' : '#FF6B00', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: creando ? 'not-allowed' : 'pointer' }}>
                  {creando ? 'Creando...' : 'Crear galería'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}