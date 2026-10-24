import {
  quedanAfuera,
  moverRango,
  type PlanDeReacomodo,
  type PropuestaFueraDeFechas,
} from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { RangoFechas } from '../../../comun/valores/rangoFechas.js';
import type { Intervalo } from '../../../comun/valores/intervalo.js';

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
    readonly estado: string;
  };
  readonly dias: RangoFechas | null;
  readonly intervaloAgendado: Intervalo | null;
  reacomodar(plan: PlanDeReacomodo, ahora?: Date): void;
  ubicar(fecha: string | null, ahora: Date): void;
}

/** RN-V3: no hay plan automático y estas propuestas quedarían fuera de las fechas nuevas. */
function reacomodoNecesario(afuera: PropuestaReacomodable[]): ErrorDeDominio {
  const propuestas: PropuestaFueraDeFechas[] = afuera.map((p) => ({
    id: p.id,
    tipo: p.propuesta.tipo,
    titulo: p.titulo,
    desde: p.dias!.desde,
    hasta: p.dias!.hasta,
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
  permitirSinDia = false,
  ahora = new Date(),
): PropuestaReacomodable[] {
  const enJuego = propuestas
    .filter((p) => p.propuesta.sigueEnJuego && p.dias !== null)
    .map((p) => ({ desde: p.dias!.desde, hasta: p.dias!.hasta, p }));
  const afuera = quedanAfuera(plan, viaje, enJuego);
  if (afuera.length > 0 && !permitirSinDia) throw reacomodoNecesario(afuera.map(({ p }) => p));
  const movidas = propuestas.filter((p) => {
    const antes = p.dias?.desde ?? null;
    if (permitirSinDia && !p.propuesta.sigueEnJuego) return false;
    if (
      permitirSinDia &&
      p.dias &&
      (afuera.some((a) => a.p.id === p.id) || moverRango(plan, p.dias) === null)
    )
      p.ubicar(null, ahora);
    else p.reacomodar(plan, ahora);
    return (p.dias?.desde ?? null) !== antes;
  });
  exigirAgendaSinConflictos(propuestas);
  return movidas;
}

/** RN-V7: el cálculo solo depende de intervalos, sin importar el módulo de actividades. */
export function exigirAgendaSinConflictos(propuestas: PropuestaReacomodable[]): void {
  const confirmadas = propuestas.filter(
    (p) => p.propuesta.estado === 'CONFIRMADA' && p.intervaloAgendado,
  );
  for (let i = 0; i < confirmadas.length; i++) {
    const a = confirmadas[i]!;
    const conflictos = confirmadas
      .slice(i + 1)
      .filter((b) => a.intervaloAgendado!.seSuperponeCon(b.intervaloAgendado!));
    if (conflictos.length)
      throw new ErrorDeDominio(
        'CONFLICTO',
        'SUPERPOSICION_HORARIA',
        `Se superponen: ${[a, ...conflictos].map((p) => p.titulo).join(', ')}.`,
        { conflictos: [a, ...conflictos].map((p) => ({ id: p.id, titulo: p.titulo })) },
      );
  }
}
