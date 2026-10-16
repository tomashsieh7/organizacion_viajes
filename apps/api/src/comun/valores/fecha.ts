import { ErrorDeDominio } from '../errores.js';

/** Día calendario en formato `YYYY-MM-DD`, sin hora ni zona horaria (D17). */
export type Fecha = string;

const FORMATO = /^\d{4}-\d{2}-\d{2}$/;

export function esFechaValida(valor: string): boolean {
  if (!FORMATO.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

export function exigirFecha(valor: string): Fecha {
  if (!esFechaValida(valor)) {
    throw new ErrorDeDominio('VALIDACION', 'FECHA_INVALIDA', `"${valor}" no es una fecha válida`);
  }
  return valor;
}

/** Suma días a una fecha calendario. */
export function sumarDias(fecha: Fecha, dias: number): Fecha {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
