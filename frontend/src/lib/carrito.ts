export interface CarritoItem {
  foto_id: string;
  event_id: string;
  event_nombre: string;
  foto_url: string;
}

const CLAVE = 'fotorunner_carrito';

export const obtenerCarrito = (): CarritoItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || '[]');
  } catch { return []; }
};

export const agregarFoto = (item: CarritoItem): void => {
  const carrito = obtenerCarrito();
  const existe = carrito.find(i => i.foto_id === item.foto_id);
  if (!existe) {
    carrito.push(item);
    localStorage.setItem(CLAVE, JSON.stringify(carrito));
  }
};

export const quitarFoto = (foto_id: string): void => {
  const carrito = obtenerCarrito().filter(i => i.foto_id !== foto_id);
  localStorage.setItem(CLAVE, JSON.stringify(carrito));
};

export const limpiarCarrito = (): void => {
  localStorage.removeItem(CLAVE);
};

export const contarItems = (): number => {
  return obtenerCarrito().length;
};

export const estaEnCarrito = (foto_id: string): boolean => {
  return obtenerCarrito().some(i => i.foto_id === foto_id);
};