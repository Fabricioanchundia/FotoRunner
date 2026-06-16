export const guardarToken = (token: string, role: string) => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  // Guardar en cookie para que el middleware lo lea
  document.cookie = `token=${token}; path=/; max-age=604800`;
  document.cookie = `role=${role}; path=/; max-age=604800`;
};

export const cerrarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  document.cookie = 'token=; path=/; max-age=0';
  document.cookie = 'role=; path=/; max-age=0';
  window.location.href = '/';
};

export const obtenerToken = () => localStorage.getItem('token');
export const obtenerRole = () => localStorage.getItem('role');
export const estaAutenticado = () => !!localStorage.getItem('token');