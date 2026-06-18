'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart, ChevronRight, Package, Image, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { obtenerCarrito, quitarFoto, limpiarCarrito, CarritoItem } from '@/lib/carrito';
import { WATERMARK_STYLE } from '@/lib/watermark';

const PRECIO_INDIVIDUAL = 5.99;
const PRECIO_PHOTOPASS = 11.99;

export default function CarritoPage() {
  const router = useRouter();
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [plan, setPlan] = useState<'individual' | 'photopass'>('individual');
  const [procesando, setProcesando] = useState(false);
  const [logueado, setLogueado] = useState(false);
  const [codigoPromo, setCodigoPromo] = useState('');
  const [fotoAmpliada, setFotoAmpliada] = useState<CarritoItem | null>(null);

  useEffect(() => {
    setItems(obtenerCarrito());
    setLogueado(!!localStorage.getItem('token'));
  }, []);

  const quitar = (foto_id: string) => {
    quitarFoto(foto_id);
    setItems(obtenerCarrito());
    toast.success('Foto eliminada del carrito');
  };

  // TODO: por ahora es solo visual. Para que funcione de verdad falta:
  // una tabla de cupones en la base de datos, un endpoint que valide el
  // código contra esa tabla, y aplicar el descuento real a `calcularTotal`.
  const aplicarCodigo = () => {
    if (!codigoPromo.trim()) return;
    toast('Los códigos promocionales estarán disponibles próximamente', { icon: '🏷️' });
  };

  // Agrupar por evento
  const eventoIds = [...new Set(items.map(i => i.event_id))];
  const eventoNombre = items[0]?.event_nombre || '';

  const calcularTotal = () => {
    if (plan === 'photopass') return PRECIO_PHOTOPASS;
    return items.length * PRECIO_INDIVIDUAL;
  };

  const comprar = async () => {
    if (!logueado) {
      router.push('/login?redirect=/carrito');
      return;
    }
    if (items.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    setProcesando(true);
    try {
      const { data } = await api.post('/ordenes', {
        event_id: items[0].event_id,
        foto_ids: plan === 'individual' ? items.map(i => i.foto_id) : [],
        plan_type: plan,
        total_usd: calcularTotal(),
        payment_method: 'PAYPHONE'
      });

      toast.success('Orden creada. Procesando pago...');
      limpiarCarrito();
      // TODO: redirigir a PayPhone cuando esté integrado
      toast('PayPhone en integración — Orden registrada como pendiente', { icon: '⏳', duration: 5000 });
      router.push('/perfil');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { mensaje?: string } } };
      toast.error(error.response?.data?.mensaje || 'Error al procesar la orden');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/Logo.png" alt="FR" style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a', letterSpacing: '1px' }}>FOTORUNNER</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'linear-gradient(135deg, #0ea5e9, #6366f1)', padding: '8px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
            <ShoppingCart size={16} color="white" />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{items.length} fotos</span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <Link href={items[0] ? `/eventos/${items[0].event_id}` : '/'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Volver al evento
          </Link>
        </div>

        {items.length === 0 ? (
          // CARRITO VACÍO
          <div style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShoppingCart size={36} color="#cbd5e1" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Tu carrito está vacío</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>
              Explora los eventos y agrega las fotos donde apareces
            </p>
            <Link href="/" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
              Ver eventos
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>

            {/* IZQUIERDA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* SELECTOR DE PLAN */}
              <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Elige tu plan</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                  {/* Plan individual */}
                  <div
                    onClick={() => setPlan('individual')}
                    style={{ padding: '20px', borderRadius: '14px', border: `2px solid ${plan === 'individual' ? '#0ea5e9' : '#e2e8f0'}`, cursor: 'pointer', background: plan === 'individual' ? 'linear-gradient(135deg, rgba(14,165,233,0.05), rgba(99,102,241,0.05))' : 'white', transition: 'all 0.15s', position: 'relative' }}>
                    {plan === 'individual' && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontSize: '10px', fontWeight: 900 }}>✓</span>
                      </div>
                    )}
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: plan === 'individual' ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <Image size={18} color={plan === 'individual' ? 'white' : '#94a3b8'} />
                    </div>
                    <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', marginBottom: '4px' }}>Foto individual</p>
                    <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '10px', lineHeight: 1.4 }}>
                      {items.length} {items.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}
                    </p>
                    <p style={{ fontWeight: 900, color: plan === 'individual' ? '#0ea5e9' : '#0f172a', fontSize: '22px', margin: 0 }}>
                      ${(items.length * PRECIO_INDIVIDUAL).toFixed(2)}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '11px' }}>${PRECIO_INDIVIDUAL} por foto</p>
                  </div>

                  {/* Photopass */}
                  <div
                    onClick={() => setPlan('photopass')}
                    style={{ padding: '20px', borderRadius: '14px', border: `2px solid ${plan === 'photopass' ? '#6366f1' : '#e2e8f0'}`, cursor: 'pointer', background: plan === 'photopass' ? 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))' : 'white', transition: 'all 0.15s', position: 'relative' }}>
                    {/* Badge recomendado */}
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: 'white', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '50px', whiteSpace: 'nowrap' }}>
                      MEJOR VALOR
                    </div>
                    {plan === 'photopass' && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontSize: '10px', fontWeight: 900 }}>✓</span>
                      </div>
                    )}
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: plan === 'photopass' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <Package size={18} color={plan === 'photopass' ? 'white' : '#94a3b8'} />
                    </div>
                    <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', marginBottom: '4px' }}>Photopass</p>
                    <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '10px', lineHeight: 1.4 }}>
                      Todas las fotos del evento
                    </p>
                    <p style={{ fontWeight: 900, color: plan === 'photopass' ? '#6366f1' : '#0f172a', fontSize: '22px', margin: 0 }}>
                      ${PRECIO_PHOTOPASS}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '11px' }}>Acceso ilimitado al evento</p>
                  </div>
                </div>
              </div>

              {/* FOTOS EN EL CARRITO */}
              <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Tu carrito — {items.length} {items.length === 1 ? 'imagen' : 'imágenes'}
                  </h2>
                  <button onClick={() => { limpiarCarrito(); setItems([]); }}
                    style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '8px', padding: '5px 12px', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={12} /> Vaciar
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {items.map((item) => (
                    <div key={item.foto_id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #f0f0f0' }}>
                      <div onClick={() => setFotoAmpliada(item)}
                        style={{ position: 'relative', width: '160px', height: '110px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#e2e8f0', cursor: 'pointer' }}>
                        <img src={item.foto_url} alt="foto"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160x110?text=Foto'; }} />
                        <div style={WATERMARK_STYLE} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.event_nombre}
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '12px' }}>Archivo digital JPEG · HD</p>
                        <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Vista previa con marca de agua</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontWeight: 800, color: '#0ea5e9', fontSize: '15px', marginBottom: '4px' }}>${PRECIO_INDIVIDUAL}</p>
                        <button onClick={() => quitar(item.foto_id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DERECHA — Resumen */}
            <div style={{ position: 'sticky', top: '80px' }}>

              {/* CÓDIGO PROMOCIONAL */}
              <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
                  ¿Tienes algún código promocional?
                </h3>
                <input
                  type="text"
                  value={codigoPromo}
                  onChange={(e) => setCodigoPromo(e.target.value)}
                  placeholder="Código de descuento"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
                />
                <button onClick={aplicarCodigo}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
                  Aplicar código
                </button>
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
                  Resumen del pedido
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>
                      {plan === 'individual' ? `${items.length} foto${items.length > 1 ? 's' : ''} × $${PRECIO_INDIVIDUAL}` : 'Photopass (evento completo)'}
                    </span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      ${plan === 'individual' ? (items.length * PRECIO_INDIVIDUAL).toFixed(2) : PRECIO_PHOTOPASS}
                    </span>
                  </div>
                  {plan === 'individual' && items.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>vs Photopass</span>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        Ahorras ${Math.max(0, (items.length * PRECIO_INDIVIDUAL) - PRECIO_PHOTOPASS).toFixed(2)} con Photopass
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '16px' }}>Total</span>
                  <span style={{ fontWeight: 900, color: '#0ea5e9', fontSize: '24px' }}>${calcularTotal().toFixed(2)}</span>
                </div>

                <button onClick={comprar} disabled={procesando}
                  style={{ width: '100%', background: procesando ? '#e2e8f0' : 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: procesando ? '#94a3b8' : 'white', border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 800, cursor: procesando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                  {procesando ? 'Procesando...' : (
                    <>Comprar ahora <ChevronRight size={18} /></>
                  )}
                </button>

                {!logueado && (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                    Necesitas{' '}
                    <Link href="/login?redirect=/carrito" style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>
                      iniciar sesión
                    </Link>
                    {' '}para comprar
                  </p>
                )}

                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                  <p style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', lineHeight: 1.5 }}>
                    🔒 Pago seguro · Las fotos se descargan en HD sin marca de agua tras el pago
                  </p>
                </div>
              </div>

              {/* Info fotos descargables */}
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>Incluye con tu compra:</p>
                {[
                  'Foto en alta resolución (HD)',
                  'Sin marca de agua',
                  'Descarga inmediata',
                  'Formato JPEG digital',
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: '#16a34a', fontSize: '12px' }}>✓</span>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FOTO AMPLIADA — siempre con marca de agua, igual que en la
          galería del evento. La versión sin marca solo se entrega tras el
          pago confirmado, nunca antes (ver lógica en `comprar`). */}
      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '700px', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <img src={fotoAmpliada.foto_url} alt="Vista previa"
              style={{ width: '100%', display: 'block', maxHeight: '80vh', objectFit: 'contain', backgroundColor: '#000' }} />
            <div style={WATERMARK_STYLE} />
            <button onClick={() => setFotoAmpliada(null)}
              style={{ position: 'absolute', top: '14px', right: '14px', width: '34px', height: '34px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}>
              ✕
            </button>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', padding: '20px 18px', zIndex: 20 }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '13px', margin: 0 }}>🔒 Vista previa con marca de agua</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0 }}>Se entrega en HD sin marca tras confirmar el pago</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}