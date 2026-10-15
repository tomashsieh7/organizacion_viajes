/**
 * Id para reconocer un mensaje propio antes de que el servidor lo confirme. No usa
 * `crypto.randomUUID`, que el navegador solo ofrece con HTTPS o en `localhost`: al abrir la app
 * por la IP de la red local (`http://192.168.…`) esa función no existe.
 */
export function idTemporal(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
