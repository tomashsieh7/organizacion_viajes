import type { Moneda } from '@viajes/compartido';

/** Formatea un monto en la unidad mínima de la moneda (D16), por ejemplo 150000 ARS → "$ 1.500,00". */
export function formatearMonto(monto: number, moneda: Moneda): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda.codigo,
    minimumFractionDigits: moneda.decimales,
    maximumFractionDigits: moneda.decimales,
  }).format(monto / 10 ** moneda.decimales);
}

/** "2026-12-10" → "10/12/2026". */
export function formatearFecha(fecha: string): string {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

export function nombreVisible(p: { nombre: string; apodo: string | null }): string {
  return p.apodo ? `${p.nombre} (${p.apodo})` : p.nombre;
}
