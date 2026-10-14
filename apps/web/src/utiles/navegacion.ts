/**
 * Adónde ir después de ingresar. Solo se acepta una ruta interna: empieza con `/` y no sigue
 * con otra barra (`//` o `/\`), que el navegador interpretaría como otro sitio. Si no, la lista
 * de viajes.
 */
export function destinoTrasIngresar(volver: unknown): string {
  return typeof volver === 'string' && /^\/(?![/\\])/.test(volver) ? volver : '/viajes';
}
