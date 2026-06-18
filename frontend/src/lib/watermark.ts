// Marca de agua compartida entre la galería del evento y el carrito, para
// que ambas páginas se vean exactamente igual y solo haya un lugar que
// mantener si se ajusta el diseño en el futuro.
//
// Replica el estilo de la plataforma de referencia: patrón de
// "transparencia" tipo checkerboard + rejilla de líneas punteadas
// conectando íconos + leyendas "Foto protegida" / "No tomes captura de
// pantalla" + nombre de marca grande en diagonal. Todo en un solo SVG de
// tamaño fijo: NO se repite vía CSS, porque el texto grande se duplicaría
// si se usara como mosaico. Se estira con backgroundSize: '100% 100%'.
const WATERMARK_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260">
  <defs>
    <pattern id="checker" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="rgba(255,255,255,0.10)"/>
      <rect x="10" width="10" height="10" fill="rgba(255,255,255,0.03)"/>
      <rect y="10" width="10" height="10" fill="rgba(255,255,255,0.03)"/>
      <rect x="10" y="10" width="10" height="10" fill="rgba(255,255,255,0.10)"/>
    </pattern>

    <pattern id="wm" width="110" height="72" patternUnits="userSpaceOnUse">
      <line x1="0" y1="36" x2="110" y2="36" stroke="rgba(255,255,255,0.25)" stroke-width="1" stroke-dasharray="3,3"/>
      <line x1="55" y1="0" x2="55" y2="72" stroke="rgba(255,255,255,0.25)" stroke-width="1" stroke-dasharray="3,3"/>

      <g transform="translate(18,6) scale(0.42)">
        <g fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="4">
          <rect x="0" y="6" width="40" height="32" rx="16" ry="16"/>
          <rect x="7" y="13" width="26" height="18" rx="9" ry="9"/>
        </g>
        <rect x="14" y="20" width="12" height="4.5" rx="2.25" fill="rgba(255,255,255,0.55)"/>
        <rect x="16" y="1" width="8" height="7" fill="rgba(255,255,255,0.55)"/>
      </g>
      <text x="55" y="26" text-anchor="middle" font-family="Arial, sans-serif" font-size="6" font-weight="700" fill="rgba(255,255,255,0.5)">Foto protegida</text>

      <g transform="translate(18,40) scale(0.42)">
        <g fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="4">
          <rect x="0" y="6" width="40" height="32" rx="16" ry="16"/>
          <rect x="7" y="13" width="26" height="18" rx="9" ry="9"/>
        </g>
        <rect x="14" y="20" width="12" height="4.5" rx="2.25" fill="rgba(255,255,255,0.5)"/>
        <rect x="16" y="1" width="8" height="7" fill="rgba(255,255,255,0.5)"/>
      </g>
      <text x="55" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="5.5" font-weight="600" fill="rgba(255,255,255,0.4)">No tomes captura</text>
      <text x="55" y="67" text-anchor="middle" font-family="Arial, sans-serif" font-size="5.5" font-weight="600" fill="rgba(255,255,255,0.4)">de pantalla</text>
    </pattern>
  </defs>

  <rect width="100%" height="100%" fill="rgba(15,15,20,0.25)"/>
  <rect width="100%" height="100%" fill="url(#checker)"/>
  <rect width="100%" height="100%" fill="url(#wm)"/>

  <text x="50%" y="55%" text-anchor="middle" transform="rotate(-12, 200, 143)" font-family="Arial, sans-serif" font-size="38" font-weight="900"
    fill="rgba(20,20,25,0.55)" stroke="rgba(255,255,255,0.15)" stroke-width="1" letter-spacing="1">FOTORUNNER</text>
</svg>
`);

export const WATERMARK_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 12,
  pointerEvents: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=utf-8,${WATERMARK_SVG}")`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100% 100%',
};