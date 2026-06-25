'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Calendar, MapPin, Image, Upload,
  Camera, Users, Pencil,
  Search, DollarSign, TrendingUp, Eye, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import AdminSidebar from '@/components/AdminSidebar';

interface Evento {
  id: string;
  nombre: string;
  ciudad: string;
  fecha: string;
  tipo: string;
  status: string;
  cover_url: string | null;
  precio_individual: number;
  precio_photopass: number;
  _count: { fotos: number };
}

interface Stats {
  totalUsuarios: number;
  totalEventos: number;
  totalFotos: number;
  totalOrdenes: number;
  ingresoTotal: number;
}

const SKELETON_KEYS = Array.from({ length: 6 }, (_, i) => `sk-${i}`);

// --- Dropzone genérico de arrastrar/soltar una imagen ---
// Reutilizado por ModalSubirFoto en sus dos modos (una / varias). Extraído
// como función de nivel superior (no anidada) para que su lógica no sume
// a la complejidad cognitiva del componente que lo usa. Es un <button>
// real (no un div con role="button") — el <input type="file"> oculto
// que dispara vive AFUERA, como hermano, porque un <button> no puede
// contener elementos interactivos anidados (sería HTML inválido).
function Dropzone({ onAbrirSelector, onDrop, children }: Readonly<{
  onAbrirSelector: () => void;
  onDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      onClick={onAbrirSelector}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{ width: '100%', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '14px', padding: '28px', textAlign: 'center', cursor: 'pointer', marginBottom: '16px', backgroundColor: 'rgba(255,255,255,0.02)', font: 'inherit', color: 'inherit' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      onFocus={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
      {children}
    </button>
  );
}

// --- Modal: crear galería/evento ---
// Tiene su propio estado de formulario — AdminPage solo necesita saber
// si está abierto y refrescar la lista cuando se crea uno nuevo.
function ModalCrearEvento({ onClose, onCreado }: Readonly<{ onClose: () => void; onCreado: () => void }>) {
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({
    nombre: '', ciudad: '', fecha: '', tipo: 'RUNNING',
    descripcion: '', cover_url: '',
    precio_individual: '5.99', precio_photopass: '11.99'
  });

  const crearEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    try {
      await api.post('/eventos', {
        ...form,
        fecha: new Date(form.fecha).toISOString(),
        precio_individual: Number(form.precio_individual),
        precio_photopass: Number(form.precio_photopass)
      });
      toast.success('Evento creado exitosamente');
      onClose();
      onCreado();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { mensaje?: string } } };
      toast.error(error.response?.data?.mensaje || 'Error al crear evento');
    } finally {
      setCreando(false);
    }
  };

  const camposTexto = [
    { label: 'Nombre del evento', key: 'nombre', type: 'text', placeholder: 'Half Marathon Manta 2026', required: true },
    { label: 'Ciudad', key: 'ciudad', type: 'text', placeholder: 'Manta', required: true },
    { label: 'Fecha del evento', key: 'fecha', type: 'datetime-local', placeholder: '', required: true },
    { label: 'URL de portada (opcional)', key: 'cover_url', type: 'url', placeholder: 'https://...', required: false },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>Crear nueva galería</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={crearEvento}>
          {camposTexto.map((campo) => (
            <div key={campo.key} style={{ marginBottom: '14px' }}>
              <label htmlFor={`crear-${campo.key}`} style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                {campo.label}
              </label>
              <input id={`crear-${campo.key}`} type={campo.type} required={campo.required}
                value={form[campo.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [campo.key]: e.target.value })}
                placeholder={campo.placeholder}
                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="crear-tipo" style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Tipo</label>
            <select id="crear-tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}>
              <option value="RUNNING">Running</option>
              <option value="ATLETISMO">Atletismo</option>
              <option value="CICLISMO">Ciclismo</option>
              <option value="TRIATHLON">Triatlón</option>
              <option value="TRAIL">Trail</option>
            </select>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>Precios</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="crear-precio-individual" style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '6px' }}>Individual ($)</label>
                <input id="crear-precio-individual" type="number" step="0.01" min="0.99" required value={form.precio_individual}
                  onChange={(e) => setForm({ ...form, precio_individual: e.target.value })}
                  style={{ width: '100%', backgroundColor: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '10px', padding: '10px 12px', fontSize: '16px', fontWeight: 800, color: '#38bdf8', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label htmlFor="crear-precio-photopass" style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '6px' }}>Photopass ($)</label>
                <input id="crear-precio-photopass" type="number" step="0.01" min="0.99" required value={form.precio_photopass}
                  onChange={(e) => setForm({ ...form, precio_photopass: e.target.value })}
                  style={{ width: '100%', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '10px 12px', fontSize: '16px', fontWeight: 800, color: '#a78bfa', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="crear-descripcion" style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Descripción (opcional)</label>
            <textarea id="crear-descripcion" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción del evento..." rows={2}
              style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={creando}
              style={{ flex: 1, background: creando ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: creando ? 'not-allowed' : 'pointer' }}>
              {creando ? 'Creando...' : 'Crear galería'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ResultadoSubida = { ok: true } | { ok: false; mensaje: string };

// Valida y filtra los archivos arrastrados/seleccionados para la subida
// múltiple — misma validación de antes (tipo imagen + máx 10MB), solo
// movida afuera de ModalSubirFoto para bajar su complejidad cognitiva.
function filtrarArchivosValidos(files: FileList): File[] {
  const validos: File[] = [];
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) { toast.error(`${file.name}: solo imágenes`); continue; }
    if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name}: máximo 10MB`); continue; }
    validos.push(file);
  }
  return validos;
}

// Sube una sola foto (archivo o URL) — misma lógica de red de antes,
// solo movida afuera del componente. Devuelve un resultado en vez de
// lanzar/mostrar el toast directamente, para que el componente decida
// qué hacer (cerrar modal, refrescar lista, etc.) con el mismo mensaje
// exacto que tenía cada caso de error.
async function ejecutarSubidaFoto(params: {
  eventoId: string;
  archivoFoto: File | null;
  urlFoto: string;
  urlWatermark: string;
}): Promise<ResultadoSubida> {
  try {
    let urlFinal = params.urlFoto;
    let urlWatermarkFinal = params.urlWatermark;

    if (params.archivoFoto) {
      const formData = new FormData();
      formData.append('foto', params.archivoFoto);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/upload/foto', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!data.exito) throw new Error(data.mensaje);
      urlFinal = data.datos.url;
      urlWatermarkFinal = data.datos.url_watermark;
    }

    if (!urlFinal) return { ok: false, mensaje: 'Selecciona foto o URL' };

    await api.post('/fotos', {
      event_id: params.eventoId,
      gcs_original_url: urlFinal,
      ...(urlWatermarkFinal && { gcs_watermark_url: urlWatermarkFinal })
    });
    return { ok: true };
  } catch (err: unknown) {
    const error = err as { response?: { data?: { mensaje?: string } } };
    return { ok: false, mensaje: error.response?.data?.mensaje || 'Error al subir foto' };
  }
}

// Sube varias fotos de una vez — misma lógica de red de antes.
async function ejecutarSubidaFotosVarias(params: {
  eventoId: string;
  archivos: File[];
  onArchivosSubidos?: () => void;
}): Promise<ResultadoSubida> {
  try {
    const formData = new FormData();
    params.archivos.forEach((file) => formData.append('fotos', file));
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3001/api/upload/fotos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!data.exito) throw new Error(data.mensaje);

    params.onArchivosSubidos?.();

    await api.post('/fotos/multiple', {
      event_id: params.eventoId,
      fotos: data.datos.map((r: { url: string; url_watermark: string }) => ({
        gcs_original_url: r.url,
        gcs_watermark_url: r.url_watermark
      }))
    });
    return { ok: true };
  } catch (err: unknown) {
    const error = err as { response?: { data?: { mensaje?: string } } };
    return { ok: false, mensaje: error.response?.data?.mensaje || 'Error al subir las fotos' };
  }
}

// --- Formulario: subir UNA foto (archivo o URL) ---
function FormSubirUna({ archivoFoto, previewFoto, urlFoto, subiendoFoto, onArchivo, onUrlChange, onQuitarArchivo, onSubmit, onCancelar }: Readonly<{
  archivoFoto: File | null;
  previewFoto: string;
  urlFoto: string;
  subiendoFoto: boolean;
  onArchivo: (file: File) => void;
  onUrlChange: (value: string) => void;
  onQuitarArchivo: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelar: () => void;
}>) {
  return (
    <form onSubmit={onSubmit}>
      <input id="inputFotoAdmin" type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onArchivo(f); }} />
      <Dropzone
        onAbrirSelector={() => document.getElementById('inputFotoAdmin')?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onArchivo(f); }}>
        {previewFoto ? (
          <img src={previewFoto} alt="preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px' }} />
        ) : (
          <>
            <Upload size={28} color="rgba(255,255,255,0.3)" style={{ margin: '0 auto 10px', display: 'block' }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Arrastra aquí o clic para seleccionar</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>JPG, PNG, WEBP · máx 10MB</p>
          </>
        )}
      </Dropzone>

      {archivoFoto && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>📁 {archivoFoto.name}</span>
          <button type="button" onClick={onQuitarArchivo}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>o ingresa URL</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
      </div>

      <input type="url" value={urlFoto}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="https://..."
        style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }} />

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" onClick={onCancelar}
          style={{ flex: 1, border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
          Cancelar
        </button>
        <button type="submit" disabled={subiendoFoto || (!archivoFoto && !urlFoto)}
          style={{ flex: 1, background: subiendoFoto || (!archivoFoto && !urlFoto) ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
          {subiendoFoto ? 'Subiendo...' : '+ Subir foto'}
        </button>
      </div>
    </form>
  );
}

// --- Formulario: subir VARIAS fotos ---
function FormSubirVarias({ archivosVarios, subiendoFoto, progresoVarios, onArchivos, onQuitarArchivo, onSubirVarias, onCancelar }: Readonly<{
  archivosVarios: File[];
  subiendoFoto: boolean;
  progresoVarios: { actual: number; total: number };
  onArchivos: (files: FileList) => void;
  onQuitarArchivo: (index: number) => void;
  onSubirVarias: () => void;
  onCancelar: () => void;
}>) {
  return (
    <div>
      <input id="inputFotosVariasAdmin" type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.length) { onArchivos(e.target.files); } e.target.value = ''; }} />
      <Dropzone
        onAbrirSelector={() => document.getElementById('inputFotosVariasAdmin')?.click()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) onArchivos(e.dataTransfer.files); }}>
        <Upload size={28} color="rgba(255,255,255,0.3)" style={{ margin: '0 auto 10px', display: 'block' }} />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Arrastra aquí o clic para seleccionar varias</p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>JPG, PNG, WEBP · máx 10MB cada una</p>
      </Dropzone>

      {archivosVarios.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', maxHeight: '180px', overflowY: 'auto' }}>
          {archivosVarios.map((file, i) => (
            <div key={`${file.name}-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>📁 {file.name}</span>
              <button type="button" onClick={() => onQuitarArchivo(i)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px', marginLeft: '8px' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {subiendoFoto && progresoVarios.total > 0 && (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>
          Subiendo {progresoVarios.actual} de {progresoVarios.total}...
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" onClick={onCancelar}
          style={{ flex: 1, border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
          Cancelar
        </button>
        <button type="button" onClick={onSubirVarias} disabled={subiendoFoto || archivosVarios.length === 0}
          style={{ flex: 1, background: subiendoFoto || archivosVarios.length === 0 ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
          {subiendoFoto ? 'Subiendo...' : `+ Subir ${archivosVarios.length || ''} fotos`}
        </button>
      </div>
    </div>
  );
}

// --- Modal: subir fotos a un evento (una o varias) ---
// Maneja su propio estado de subida (archivo, preview, progreso, etc.) —
// no vive en AdminPage, el modal es autocontenido. Los dos formularios
// (una/varias) viven en componentes propios para mantener la complejidad
// cognitiva de este componente baja.
function ModalSubirFoto({ evento, onClose, onSubido }: Readonly<{
  evento: Evento;
  onClose: () => void;
  onSubido: () => void;
}>) {
  const [modoSubida, setModoSubida] = useState<'una' | 'varias'>('una');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState('');
  const [archivosVarios, setArchivosVarios] = useState<File[]>([]);
  const [progresoVarios, setProgresoVarios] = useState({ actual: 0, total: 0 });
  const [urlFoto, setUrlFoto] = useState('');
  const [urlWatermark, setUrlWatermark] = useState('');

  const manejarArchivo = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Máximo 10MB'); return; }
    setArchivoFoto(file);
    setPreviewFoto(URL.createObjectURL(file));
    setUrlFoto('');
    setUrlWatermark('');
  };

  const manejarCambioUrl = (value: string) => {
    setUrlFoto(value);
    if (value) { setArchivoFoto(null); setPreviewFoto(''); }
  };

  const limpiarArchivoFoto = () => {
    setArchivoFoto(null);
    setPreviewFoto('');
    setUrlWatermark('');
  };

  const manejarArchivosVarios = (files: FileList) => {
    const validos = filtrarArchivosValidos(files);
    if (validos.length === 0) return;
    setArchivosVarios(prev => [...prev, ...validos]);
  };

  const quitarArchivoVarios = (index: number) => {
    setArchivosVarios(prev => prev.filter((_, i) => i !== index));
  };

  const subirFoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubiendoFoto(true);
    const resultado = await ejecutarSubidaFoto({ eventoId: evento.id, archivoFoto, urlFoto, urlWatermark });
    setSubiendoFoto(false);
    if (resultado.ok) {
      toast.success('¡Foto subida con marca de agua!');
      onClose();
      onSubido();
    } else {
      toast.error(resultado.mensaje);
    }
  };

  const subirFotosVarias = async () => {
    if (archivosVarios.length === 0) return;
    setSubiendoFoto(true);
    setProgresoVarios({ actual: 0, total: archivosVarios.length });
    const resultado = await ejecutarSubidaFotosVarias({
      eventoId: evento.id,
      archivos: archivosVarios,
      onArchivosSubidos: () => setProgresoVarios({ actual: archivosVarios.length, total: archivosVarios.length })
    });
    setSubiendoFoto(false);
    setProgresoVarios({ actual: 0, total: 0 });
    if (resultado.ok) {
      toast.success(`¡${archivosVarios.length} fotos subidas con marca de agua!`);
      onClose();
      onSubido();
    } else {
      toast.error(resultado.mensaje);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>Subir fotos</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '16px' }}>
          {evento.nombre}
        </p>

        {/* PESTAÑAS Subir una / Subir varias */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', marginBottom: '16px' }}>
          <button type="button" onClick={() => setModoSubida('una')}
            style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, backgroundColor: modoSubida === 'una' ? 'rgba(99,102,241,0.18)' : 'transparent', color: modoSubida === 'una' ? '#a5b4fc' : 'rgba(255,255,255,0.4)' }}>
            Subir una
          </button>
          <button type="button" onClick={() => setModoSubida('varias')}
            style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, backgroundColor: modoSubida === 'varias' ? 'rgba(99,102,241,0.18)' : 'transparent', color: modoSubida === 'varias' ? '#a5b4fc' : 'rgba(255,255,255,0.4)' }}>
            Subir varias
          </button>
        </div>

        <div style={{ backgroundColor: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '8px', padding: '8px 12px', marginBottom: '16px' }}>
          <p style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>
            🔒 La marca de agua se genera automáticamente al subir el archivo
          </p>
        </div>

        {modoSubida === 'una' ? (
          <FormSubirUna
            archivoFoto={archivoFoto}
            previewFoto={previewFoto}
            urlFoto={urlFoto}
            subiendoFoto={subiendoFoto}
            onArchivo={manejarArchivo}
            onUrlChange={manejarCambioUrl}
            onQuitarArchivo={limpiarArchivoFoto}
            onSubmit={subirFoto}
            onCancelar={onClose}
          />
        ) : (
          <FormSubirVarias
            archivosVarios={archivosVarios}
            subiendoFoto={subiendoFoto}
            progresoVarios={progresoVarios}
            onArchivos={manejarArchivosVarios}
            onQuitarArchivo={quitarArchivoVarios}
            onSubirVarias={subirFotosVarias}
            onCancelar={onClose}
          />
        )}
      </div>
    </div>
  );
}

// --- Modal: editar evento (nombre, ciudad, fecha, tipo, portada y precios
// reunidos en un solo formulario) ---
// Carga las fotos del evento (para elegir portada) apenas se monta.
function ModalEditarEvento({ evento, onClose, onGuardado }: Readonly<{
  evento: Evento;
  onClose: () => void;
  onGuardado: () => void;
}>) {
  const [formEditar, setFormEditar] = useState({
    nombre: '', ciudad: '', fecha: '', tipo: 'RUNNING',
    cover_url: '', precio_individual: '', precio_photopass: ''
  });
  const [fotosEventoEditar, setFotosEventoEditar] = useState<{ id: string; gcs_watermark_url: string | null; gcs_original_url: string }[]>([]);
  const [cargandoFotosEditar, setCargandoFotosEditar] = useState(false);
  const [guardandoEditar, setGuardandoEditar] = useState(false);

  useEffect(() => {
    const fechaLocal = new Date(evento.fecha);
    fechaLocal.setMinutes(fechaLocal.getMinutes() - fechaLocal.getTimezoneOffset());
    setFormEditar({
      nombre: evento.nombre,
      ciudad: evento.ciudad,
      fecha: fechaLocal.toISOString().slice(0, 16),
      tipo: evento.tipo,
      cover_url: evento.cover_url || '',
      precio_individual: String(evento.precio_individual || 5.99),
      precio_photopass: String(evento.precio_photopass || 11.99)
    });

    setCargandoFotosEditar(true);
    api.get(`/fotos/evento/${evento.id}`)
      .then(({ data }) => setFotosEventoEditar(data.datos))
      .catch(() => {
        // Si fallan las fotos no bloqueamos el resto del formulario —
        // simplemente no se muestran miniaturas de portada disponibles.
        setFotosEventoEditar([]);
      })
      .finally(() => setCargandoFotosEditar(false));
  }, [evento]);

  const guardarEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoEditar(true);
    try {
      await api.patch(`/admin/eventos/${evento.id}`, {
        nombre: formEditar.nombre,
        ciudad: formEditar.ciudad,
        fecha: new Date(formEditar.fecha).toISOString(),
        tipo: formEditar.tipo,
        cover_url: formEditar.cover_url || null,
        precio_individual: Number(formEditar.precio_individual),
        precio_photopass: Number(formEditar.precio_photopass)
      });
      toast.success('Evento actualizado exitosamente');
      onClose();
      onGuardado();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { mensaje?: string } } };
      toast.error(error.response?.data?.mensaje || 'Error al actualizar el evento');
    } finally {
      setGuardandoEditar(false);
    }
  };

  let contenidoPortada;
  if (cargandoFotosEditar) {
    contenidoPortada = <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Cargando fotos del evento...</p>;
  } else if (fotosEventoEditar.length === 0) {
    contenidoPortada = <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Este evento aún no tiene fotos subidas para elegir portada.</p>;
  } else {
    contenidoPortada = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', maxHeight: '220px', overflowY: 'auto', padding: '4px' }}>
        {fotosEventoEditar.map((foto) => {
          const url = foto.gcs_watermark_url || foto.gcs_original_url;
          const seleccionada = formEditar.cover_url === url;
          return (
            <button key={foto.id} type="button" onClick={() => setFormEditar({ ...formEditar, cover_url: url })}
              style={{ position: 'relative', padding: 0, border: seleccionada ? '3px solid #a78bfa' : '3px solid transparent', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', aspectRatio: '1/1', backgroundColor: '#0f172a' }}>
              <img src={url} alt="Foto del evento" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {seleccionada && (
                <div style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#a78bfa', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>✓</div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>Editar evento</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '24px' }}>{evento.nombre}</p>

        <form onSubmit={guardarEditar}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label htmlFor="editar-nombre" style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Nombre</label>
              <input id="editar-nombre" type="text" required value={formEditar.nombre}
                onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label htmlFor="editar-ciudad" style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Ciudad</label>
              <input id="editar-ciudad" type="text" required value={formEditar.ciudad}
                onChange={(e) => setFormEditar({ ...formEditar, ciudad: e.target.value })}
                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label htmlFor="editar-fecha" style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Fecha</label>
              <input id="editar-fecha" type="datetime-local" required value={formEditar.fecha}
                onChange={(e) => setFormEditar({ ...formEditar, fecha: e.target.value })}
                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label htmlFor="editar-tipo" style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Tipo</label>
              <select id="editar-tipo" value={formEditar.tipo} onChange={(e) => setFormEditar({ ...formEditar, tipo: e.target.value })}
                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}>
                <option value="RUNNING">Running</option>
                <option value="ATLETISMO">Atletismo</option>
                <option value="CICLISMO">Ciclismo</option>
                <option value="TRIATHLON">Triatlón</option>
                <option value="TRAIL">Trail</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Portada</p>
            {contenidoPortada}
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>Precios</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="editar-precio-individual" style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '8px' }}>Individual ($)</label>
                <input id="editar-precio-individual" type="number" step="0.01" min="0.99" required value={formEditar.precio_individual}
                  onChange={(e) => setFormEditar({ ...formEditar, precio_individual: e.target.value })}
                  style={{ width: '100%', backgroundColor: 'rgba(14,165,233,0.1)', border: '2px solid rgba(14,165,233,0.3)', borderRadius: '12px', padding: '12px', fontSize: '20px', fontWeight: 900, color: '#38bdf8', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} />
              </div>
              <div>
                <label htmlFor="editar-precio-photopass" style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '8px' }}>Photopass ($)</label>
                <input id="editar-precio-photopass" type="number" step="0.01" min="0.99" required value={formEditar.precio_photopass}
                  onChange={(e) => setFormEditar({ ...formEditar, precio_photopass: e.target.value })}
                  style={{ width: '100%', backgroundColor: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.3)', borderRadius: '12px', padding: '12px', fontSize: '20px', fontWeight: 900, color: '#a78bfa', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardandoEditar}
              style={{ flex: 2, background: guardandoEditar ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              {guardandoEditar ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [mostrarSubirFoto, setMostrarSubirFoto] = useState(false);
  const [eventoEditar, setEventoEditar] = useState<Evento | null>(null);

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    try {
      const [{ data: dataEventos }, { data: dataStats }] = await Promise.all([
        api.get('/eventos'),
        api.get('/admin/stats')
      ]);
      setEventos(dataEventos.datos);
      setStats(dataStats.datos);
    } catch {
      router.push('/login');
    } finally {
      setCargando(false);
    }
  };

  const cambiarStatus = async (eventoId: string, status: string) => {
    try {
      await api.patch(`/admin/eventos/${eventoId}/status`, { status });
      setEventos(prev => prev.map(e => e.id === eventoId ? { ...e, status } : e));
      toast.success('Estado actualizado');
    } catch { toast.error('Error al cambiar estado'); }
  };

  const eventosFiltrados = eventos.filter(e => {
    const matchBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.ciudad.toLowerCase().includes(busqueda.toLowerCase());
    const matchStatus = filtroStatus === 'TODOS' || e.status === filtroStatus;
    return matchBusqueda && matchStatus;
  });

  const colorStatus = (s: string) => {
    if (s === 'ACTIVO') return { bg: '#dcfce7', color: '#16a34a' };
    if (s === 'PROXIMO') return { bg: '#dbeafe', color: '#2563eb' };
    return { bg: '#f1f5f9', color: '#64748b' };
  };

  let contenidoGrid;
  if (cargando) {
    contenidoGrid = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {SKELETON_KEYS.map((key) => (
          <div key={key} style={{ backgroundColor: '#1d1a38', borderRadius: '16px', height: '280px' }} />
        ))}
      </div>
    );
  } else if (eventosFiltrados.length === 0) {
    contenidoGrid = (
      <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>
        <Camera size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
        <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px', color: 'rgba(255,255,255,0.5)' }}>No hay galerías</p>
        <button onClick={() => setMostrarForm(true)}
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '12px' }}>
          + Crear primera galería
        </button>
      </div>
    );
  } else {
    contenidoGrid = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {eventosFiltrados.map((evento) => {
          const sc = colorStatus(evento.status);
          return (
            <div key={evento.id} style={{ background: 'linear-gradient(160deg, #1e1b4b, #1e1b4b)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(165,180,252,0.1)' }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', backgroundColor: '#0f172a' }}>
                {evento.cover_url ? (
                  <img src={evento.cover_url} alt={evento.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image size={32} color="rgba(255,255,255,0.1)" />
                  </div>
                )}
                <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px' }}>
                  {evento.tipo}
                </span>
                <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: sc.bg, color: sc.color, fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px' }}>
                  {evento.status}
                </span>
                <span style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Image size={10} /> {evento._count.fotos} fotos
                </span>
              </div>

              <div style={{ padding: '16px' }}>
                <h3 style={{ color: 'white', fontWeight: 800, fontSize: '15px', marginBottom: '6px', lineHeight: 1.3 }}>
                  {evento.nombre}
                </h3>
                <div style={{ display: 'flex', gap: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} /> {evento.ciudad}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={11} /> {new Date(evento.fecha).toLocaleDateString('es-EC')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, backgroundColor: 'rgba(14,165,233,0.1)', borderRadius: '8px', padding: '7px 10px', border: '1px solid rgba(14,165,233,0.2)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: 700, marginBottom: '2px' }}>INDIVIDUAL</p>
                    <p style={{ color: '#38bdf8', fontWeight: 900, fontSize: '15px' }}>${evento.precio_individual || 5.99}</p>
                  </div>
                  <div style={{ flex: 1, backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: '8px', padding: '7px 10px', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: 700, marginBottom: '2px' }}>PHOTOPASS</p>
                    <p style={{ color: '#a78bfa', fontWeight: 900, fontSize: '15px' }}>${evento.precio_photopass || 11.99}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Link href={`/admin/eventos/${evento.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', textDecoration: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 600 }}>
                    <Eye size={11} /> Ver fotos ({evento._count.fotos})
                  </Link>
                  <button onClick={() => { setEventoSeleccionado(evento); setMostrarSubirFoto(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                    <Upload size={11} /> Subir
                  </button>
                  <button onClick={() => setEventoEditar(evento)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', backgroundColor: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '8px', color: '#c4b5fd', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                    <Pencil size={11} /> Editar
                  </button>
                  <select value={evento.status} onChange={(e) => cambiarStatus(evento.id, e.target.value)}
                    style={{ padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '11px', cursor: 'pointer', outline: 'none' }}>
                    <option value="PROXIMO">Próximo</option>
                    <option value="ACTIVO">Activo</option>
                    <option value="COMPLETADO">Completado</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#16142a' }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#16142a' }}>

        {/* TOPBAR */}
        <div style={{ backgroundColor: '#1d1a38', padding: '16px 28px', borderBottom: '1px solid rgba(165,180,252,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '2px' }}>Panel administrador</p>
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 800 }}>Mis galerías</h1>
          </div>
          <button onClick={() => setMostrarForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16} /> Crear galería
          </button>
        </div>

        {/* STATS */}
        {stats && (
          <div style={{ backgroundColor: '#1d1a38', padding: '12px 28px', borderBottom: '1px solid rgba(165,180,252,0.1)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Eventos', valor: stats.totalEventos, icon: <Calendar size={13} />, color: '#0ea5e9' },
              { label: 'Fotos', valor: stats.totalFotos, icon: <Camera size={13} />, color: '#a78bfa' },
              { label: 'Usuarios', valor: stats.totalUsuarios, icon: <Users size={13} />, color: '#34d399' },
              { label: 'Ventas', valor: stats.totalOrdenes, icon: <TrendingUp size={13} />, color: '#fb923c' },
              { label: 'Ingresos', valor: `$${Number(stats.ingresoTotal).toFixed(2)}`, icon: <DollarSign size={13} />, color: '#facc15' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '8px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginBottom: '1px' }}>{s.label}</p>
                  <p style={{ color: 'white', fontSize: '15px', fontWeight: 800 }}>{s.valor}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FILTROS */}
        <div style={{ backgroundColor: '#1d1a38', padding: '12px 28px', borderBottom: '1px solid rgba(165,180,252,0.1)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '7px 12px', flex: 1, maxWidth: '260px' }}>
            <Search size={13} color="rgba(255,255,255,0.4)" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar galería..."
              style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '13px', width: '100%' }} />
          </div>
          {['TODOS', 'PROXIMO', 'ACTIVO', 'COMPLETADO'].map((s) => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, backgroundColor: filtroStatus === s ? '#0ea5e9' : 'rgba(255,255,255,0.06)', color: filtroStatus === s ? 'white' : 'rgba(255,255,255,0.4)' }}>
              {s === 'TODOS' ? 'Todos' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: 'auto' }}>
            {eventosFiltrados.length} de {eventos.length}
          </span>
        </div>

        {/* GRID */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', backgroundColor: '#16142a' }}>
          {contenidoGrid}
        </div>
      </div>

      {mostrarForm && (
        <ModalCrearEvento onClose={() => setMostrarForm(false)} onCreado={cargarTodo} />
      )}

      {mostrarSubirFoto && eventoSeleccionado && (
        <ModalSubirFoto
          evento={eventoSeleccionado}
          onClose={() => setMostrarSubirFoto(false)}
          onSubido={cargarTodo}
        />
      )}

      {/* MODAL EDITAR EVENTO — nombre, ciudad, fecha, tipo, portada y precios reunidos en un solo formulario */}
      {eventoEditar && (
        <ModalEditarEvento
          evento={eventoEditar}
          onClose={() => setEventoEditar(null)}
          onGuardado={cargarTodo}
        />
      )}
    </div>
  );
}