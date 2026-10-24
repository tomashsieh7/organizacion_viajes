import {
  pasaLaMedianoche,
  sumarMinutos,
  type EstadoPropuesta,
  type Moneda,
} from '@viajes/compartido';
import type { NombreIcono } from '../componentes/base/IconoLinea.vue';

/** Formatea un monto en la unidad mínima de la moneda (D16), por ejemplo 150000 ARS → "$ 1.500,00". */
export function formatearMonto(monto: number, moneda: Moneda): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda.codigo,
    minimumFractionDigits: moneda.decimales,
    maximumFractionDigits: moneda.decimales,
  }).format(monto / 10 ** moneda.decimales);
}

export const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** "2026-12-10" → "10 dic 2026", con el mismo estilo que los rangos. */
function formatearFecha(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  return `${d} ${MESES[m - 1]} ${a}`;
}

/**
 * Rango de fechas fácil de leer, sin repetir el mes ni el año cuando coinciden:
 * "10 al 16 dic 2026", "28 nov al 3 dic 2026" o "28 dic 2026 al 3 ene 2027".
 */
export function formatearRango(desde: string, hasta: string): string {
  const [a1, m1, d1] = desde.split('-').map(Number) as [number, number, number];
  const [a2, m2, d2] = hasta.split('-').map(Number) as [number, number, number];
  const fin = `${d2} ${MESES[m2 - 1]} ${a2}`;
  // Un viaje de un solo día: "10 dic 2026", no "10 al 10 dic 2026".
  if (desde === hasta) return fin;
  if (a1 !== a2) return `${d1} ${MESES[m1 - 1]} ${a1} al ${fin}`;
  if (m1 !== m2) return `${d1} ${MESES[m1 - 1]} al ${fin}`;
  return `${d1} al ${fin}`;
}

/** RN-V2: "1 semana para adelante" o "2 semanas para atrás". */
export function semanasCorridas(semanas: number): string {
  const n = Math.abs(semanas);
  return `${n} ${n === 1 ? 'semana' : 'semanas'} ${semanas > 0 ? 'para adelante' : 'para atrás'}`;
}

/** Día de un instante ISO en la zona del dispositivo, con el mismo estilo: "14 oct 2026". */
export function formatearDia(instante: string): string {
  const d = new Date(instante);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** Símbolo de la moneda como lo escribe el resto de la app: "$" para pesos, "US$" para dólares. */
export function simboloMoneda(moneda: Moneda): string {
  return (
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda.codigo })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? moneda.codigo
  );
}

/** Hora de un instante en el dispositivo, con 24 horas como el resto de la app: "21:26". */
export function formatearHora(instante: string): string {
  const d = new Date(instante);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** Día de un instante para separar el chat: "Hoy", "Ayer", "24 sep" o "24 sep 2025" si es de otro año. */
export function etiquetaDelDia(instante: string, ahora: Date = new Date()): string {
  const d = new Date(instante);
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diferencia = Math.round((dia(ahora) - dia(d)) / 86_400_000);
  if (diferencia === 0) return 'Hoy';
  if (diferencia === 1) return 'Ayer';
  const base = `${d.getDate()} ${MESES[d.getMonth()]}`;
  return d.getFullYear() === ahora.getFullYear() ? base : `${base} ${d.getFullYear()}`;
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

/** Ícono de cada estado: el de la etiqueta de las tarjetas, los renglones y el filtro. */
export const ICONOS_ESTADO: Record<EstadoPropuesta, NombreIcono> = {
  PENDIENTE: 'reloj',
  CONFIRMADA: 'check',
  DENEGADA: 'cruz',
  CANCELADA: 'prohibido',
};

/** 150 → "2 h 30 min". */
export function formatearDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}

/** "11 dic 2026 · 23:30 a 01:00 del día siguiente". */
export function formatearHorario(a: {
  fecha: string | null;
  horaInicio: string;
  duracionMin: number;
}) {
  const fin = sumarMinutos(a.horaInicio, a.duracionMin);
  const siguiente = pasaLaMedianoche(a.horaInicio, a.duracionMin) ? ' del día siguiente' : '';
  return `${a.fecha ? formatearFecha(a.fecha) : 'Sin día'} · ${a.horaInicio} a ${fin}${siguiente}`;
}
