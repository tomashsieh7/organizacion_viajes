import { MESES } from './formato';

/** Fecha `YYYY-MM-DD` del dispositivo, en su zona horaria (P19, D17). */
export function hoyDelDispositivo(ahora: Date = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
}

/** Todos los días entre dos fechas, ambas incluidas. */
export function diasEntre(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  const d = new Date(`${desde}T00:00:00Z`);
  for (let dia = desde; dia <= hasta; dia = d.toISOString().slice(0, 10)) {
    dias.push(dia);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dias;
}

/**
 * RN-M1, la misma regla que usa la API para el mapa: hoy si cae dentro del viaje; si no, el
 * primer día con actividad confirmada; si no hay ninguno, el primer día del viaje.
 */
export function diaInicial(dias: string[], diasConActividad: string[], hoy: string): string {
  if (dias.includes(hoy)) return hoy;
  return dias.find((d) => diasConActividad.includes(d)) ?? dias[0]!;
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** "2026-12-11" → "viernes 11 dic", con el mes abreviado como el resto de las fechas. */
export function nombreDelDia(fecha: string): string {
  const [, m, d] = fecha.split('-').map(Number) as [number, number, number];
  return `${DIAS_SEMANA[new Date(`${fecha}T00:00:00Z`).getUTCDay()]} ${d} ${MESES[m - 1]}`;
}
