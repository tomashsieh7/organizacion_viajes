import type { EstadoPropuesta, ResumenPlanificacion } from './contratos.js';
import { diasEntre } from './reacomodo.js';

/** Datos mínimos de lectura; no necesita títulos, votos ni entidades persistidas. */
export interface PropuestaParaPlanificacion {
  estado: EstadoPropuesta;
  actividad?: { fecha: string | null } | null;
  alojamiento?: { fechaDesde: string | null; fechaHasta: string | null } | null;
}

export function resumirPlanificacion(
  viaje: { fechaInicio: string; fechaFin: string },
  propuestas: readonly PropuestaParaPlanificacion[],
): ResumenPlanificacion {
  const activas = propuestas.filter((p) => p.estado === 'PENDIENTE' || p.estado === 'CONFIRMADA');
  const rangos = activas
    .flatMap((p) => {
      const a = p.alojamiento;
      if (p.estado !== 'CONFIRMADA' || !a?.fechaDesde || !a.fechaHasta) return [];
      const desde = a.fechaDesde < viaje.fechaInicio ? viaje.fechaInicio : a.fechaDesde;
      const hasta = a.fechaHasta > viaje.fechaFin ? viaje.fechaFin : a.fechaHasta;
      return desde < hasta ? [{ desde, hasta }] : [];
    })
    .sort((a, b) => a.desde.localeCompare(b.desde));
  let cubiertas = 0;
  let fin = viaje.fechaInicio;
  for (const r of rangos) {
    const inicio = r.desde > fin ? r.desde : fin;
    if (r.hasta > inicio) cubiertas += diasEntre(inicio, r.hasta);
    if (r.hasta > fin) fin = r.hasta;
  }
  return {
    nochesSinAlojamiento: Math.max(0, diasEntre(viaje.fechaInicio, viaje.fechaFin) - cubiertas),
    propuestasPendientes: activas.filter((p) => p.estado === 'PENDIENTE').length,
    propuestasSinDia: activas.filter((p) =>
      p.actividad ? p.actividad.fecha === null : p.alojamiento?.fechaDesde === null,
    ).length,
  };
}
