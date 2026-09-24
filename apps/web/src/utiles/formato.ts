import { pasaLaMedianoche, sumarMinutos, type Moneda } from '@viajes/compartido';

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

/**
 * Convierte lo que escribe la persona ("48000", "48000,50" o "48.000,50") a la unidad mínima de la
 * moneda. Devuelve `null` si el texto no es un monto válido.
 */
export function aUnidadMinima(texto: string, decimales: number): number | null {
  const limpio = texto.trim().replace(/\s/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+([.,]\d+)?$/.test(limpio)) return null;
  // En castellano el punto separa miles y la coma los decimales; sin coma, "48.000" se lee como miles
  // y "48.5" como decimal.
  const conMiles = /^\d{1,3}(\.\d{3})+$/.test(limpio);
  const normalizado = limpio.includes(',')
    ? limpio.replace(/\./g, '').replace(',', '.')
    : conMiles
      ? limpio.replace(/\./g, '')
      : limpio;
  const [entero = '0', fraccion = ''] = normalizado.split('.');
  if (fraccion.length > decimales) return null;
  const valor = Number(entero) * 10 ** decimales + Number(fraccion.padEnd(decimales, '0') || '0');
  return Number.isSafeInteger(valor) ? valor : null;
}

export const NOMBRES_ESTADO: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  DENEGADA: 'Denegada',
  CANCELADA: 'Cancelada',
};

/** 150 → "2 h 30 min". */
export function formatearDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}

/** "11/12/2026 · 23:30 a 01:00 del día siguiente". */
export function formatearHorario(a: { fecha: string; horaInicio: string; duracionMin: number }) {
  const fin = sumarMinutos(a.horaInicio, a.duracionMin);
  const siguiente = pasaLaMedianoche(a.horaInicio, a.duracionMin) ? ' del día siguiente' : '';
  return `${formatearFecha(a.fecha)} · ${a.horaInicio} a ${fin}${siguiente}`;
}
