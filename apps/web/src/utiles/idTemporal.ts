/**
 * Id para reconocer un mensaje propio antes de que el servidor lo confirme. No usa
 * `crypto.randomUUID`, que el navegador solo ofrece con HTTPS o en `localhost`: al abrir la app
 * por la IP de la red local (`http://192.168.…`) esa función no existe.
 */
export function idTemporal(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * UUID versión 4 al azar, con la misma fuente que `idTemporal` para que funcione también por la IP
 * de la red local. Identifica un intento de crear un viaje, así un reintento no lo duplica.
 */
export function uuidAlAzar(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
