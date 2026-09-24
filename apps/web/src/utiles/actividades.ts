import type { ActividadVista } from '@viajes/compartido';

export interface GrupoDeOpciones {
  actividad: ActividadVista;
  alternativas: ActividadVista[];
}

/**
 * Agrupa cada actividad original con sus alternativas (P9), respetando el orden de la lista.
 * Si un filtro deja afuera a la original, la alternativa se muestra sola y conserva la referencia.
 */
export function agruparOpciones(actividades: ActividadVista[]): GrupoDeOpciones[] {
  const ids = new Set(actividades.map((a) => a.id));
  const grupos = new Map<string, GrupoDeOpciones>();
  for (const a of actividades) {
    const original = a.actividad.alternativaDe?.id;
    if (!original || !ids.has(original)) grupos.set(a.id, { actividad: a, alternativas: [] });
  }
  for (const a of actividades) {
    const original = a.actividad.alternativaDe?.id;
    if (original && ids.has(original)) grupos.get(original)?.alternativas.push(a);
  }
  return [...grupos.values()];
}
