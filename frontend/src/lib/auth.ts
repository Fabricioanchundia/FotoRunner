export const guardarToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const obtenerToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const cerrarSesion = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export const estaAutenticado = () => {
  return !!obtenerToken();
};