import {
  quedanAfuera,
  type PlanDeReacomodo,
  type PropuestaFueraDeFechas,
} from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { RangoFechas } from '../../../comun/valores/rangoFechas.js';

/**
 * Lo que el reacomodo necesita de una propuesta (D26). Cada tipo sabe moverse según el plan
 * (polimorfismo): la actividad por su día y el alojamiento por su día de entrada.
 */
export interface PropuestaReacomodable {
  readonly id: string;
  readonly titulo: string;
  readonly propuesta: {
    readonly tipo: 'ACTIVIDAD' | 'ALOJAMIENTO';
    readonly sigueEnJuego: boolean;
  };
  readonly dias: RangoFechas;
  reacomodar(plan: PlanDeReacomodo): void;
}

/** RN-V3: no hay plan automático y estas propuestas quedarían fuera de las fechas nuevas. */
function reacomodoNecesario(afuera: PropuestaReacomodable[]): ErrorDeDominio {
  const propuestas: PropuestaFueraDeFechas[] = afuera.map((p) => ({
    id: p.id,
    tipo: p.propuesta.tipo,
    titulo: p.titulo,
    desde: p.dias.desde,
    hasta: p.dias.hasta,
  }));
  return new ErrorDeDominio(
    'CONFLICTO',
    'REACOMODO_NECESARIO',
    'Con estas fechas hay propuestas que quedan afuera del viaje',
    { propuestas },
  );
}

/**
 * RN-V2 y RN-V3: mueve cada propuesta según el plan y exige que las pendientes y confirmadas
 * queden dentro del viaje. Devuelve las que cambiaron de día, para guardarlas.
 */
export function aplicarPlan(
  plan: PlanDeReacomodo,
  propuestas: PropuestaReacomodable[],
  viaje: RangoFechas,
): PropuestaReacomodable[] {
  const enJuego = propuestas
    .filter((p) => p.propuesta.sigueEnJuego)
    .map((p) => ({ desde: p.dias.desde, hasta: p.dias.hasta, p }));
  const afuera = quedanAfuera(plan, viaje, enJuego);
  if (afuera.length > 0) throw reacomodoNecesario(afuera.map(({ p }) => p));
  return propuestas.filter((p) => {
    const antes = p.dias.desde;
    p.reacomodar(plan);
    return p.dias.desde !== antes;
  });
}
