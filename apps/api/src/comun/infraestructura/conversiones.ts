import type { Fecha } from '../valores/fecha.js';

/** Columna DATE de PostgreSQL (llega como medianoche UTC) a día calendario `YYYY-MM-DD`. */
export function aFecha(valor: Date): Fecha {
  return valor.toISOString().slice(0, 10);
}

export function deFecha(fecha: Fecha): Date {
  return new Date(`${fecha}T00:00:00Z`);
}

/** BIGINT de la base a entero seguro del dominio (D24). */
export function aMonto(valor: bigint): number {
  const n = Number(valor);
  if (!Number.isSafeInteger(n)) throw new Error(`Monto fuera de rango: ${valor}`);
  return n;
}

/** Columna TIME (llega como 1970-01-01 a esa hora en UTC) a `HH:mm`. */
export function aHora(valor: Date): string {
  return valor.toISOString().slice(11, 16);
}

export function deHora(hora: string): Date {
  return new Date(`1970-01-01T${hora}:00Z`);
}
