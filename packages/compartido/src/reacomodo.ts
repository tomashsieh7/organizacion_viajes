/**
 * RN-V2 y D26: reacomodo de las propuestas cuando cambian las fechas del viaje. Un plan dice a qué
 * día nuevo va lo que había en cada día viejo; las funciones que lo arman son intercambiables
 * (`ArmadorDePlan`) y una sola aplicación lo usa para todas las propuestas. La pantalla lo usa para
 * mostrar el resumen antes de guardar y el servidor para guardar, así los dos hacen lo mismo.
 */

/** Rango de días `YYYY-MM-DD` con los dos extremos incluidos. */
export interface RangoDeDias {
  desde: string;
  hasta: string;
}

/** Día viejo → día nuevo. Un día que no figura queda como estaba. */
export type PlanDeReacomodo = Readonly<Record<string, string | null>>;

/** Arma un plan para pasar de unas fechas del viaje a otras, o `null` si no corresponde. */
export type ArmadorDePlan = (
  antes: RangoDeDias,
  despues: RangoDeDias,
  eleccion?: PlanDeReacomodo,
) => PlanDeReacomodo | null;

/**
 * Lo que el plan tiene que dejar dentro del viaje: cada actividad es un rango de un solo día y
 * cada alojamiento, su estadía.
 */
export type OcupacionDelViaje = readonly RangoDeDias[];

/** Cómo se reacomodó: sin mover nada, o corriendo todo esa cantidad de semanas. */
export interface PlanElegido {
  plan: PlanDeReacomodo;
  semanas: number;
}

const DIA_EN_MS = 86_400_000;
const comoFecha = (dia: string) => Date.parse(`${dia}T00:00:00Z`);

export function sumarDias(dia: string, dias: number): string {
  return new Date(comoFecha(dia) + dias * DIA_EN_MS).toISOString().slice(0, 10);
}

/** Días que van de `desde` a `hasta` (negativo si `hasta` es anterior). */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((comoFecha(hasta) - comoFecha(desde)) / DIA_EN_MS);
}

const contiene = (rango: RangoDeDias, dia: string) => rango.desde <= dia && dia <= rango.hasta;

/** Nada se mueve. */
export const planSinCambios: ArmadorDePlan = () => ({});

/**
 * Todo se corre las mismas semanas que el comienzo del viaje, así cada cosa conserva su día de la
 * semana. No corresponde si el comienzo no se corre o no se corre semanas enteras.
 */
export const planCorriendoSemanas: ArmadorDePlan = (antes, despues) => {
  const corrimiento = diasEntre(antes.desde, despues.desde);
  if (corrimiento === 0 || corrimiento % 7 !== 0) return null;
  const plan: Record<string, string> = {};
  for (let dia = antes.desde; dia <= antes.hasta; dia = sumarDias(dia, 1)) {
    plan[dia] = sumarDias(dia, corrimiento);
  }
  return plan;
};

export function moverDia(plan: PlanDeReacomodo, dia: string): string | null {
  return Object.hasOwn(plan, dia) ? plan[dia]! : dia;
}

/** Un rango se mueve por su primer día y conserva el largo: un alojamiento, sus noches. */
export function moverRango(plan: PlanDeReacomodo, rango: RangoDeDias): RangoDeDias | null {
  const desde = moverDia(plan, rango.desde);
  return desde === null
    ? null
    : { desde, hasta: sumarDias(desde, diasEntre(rango.desde, rango.hasta)) };
}

/** Lo que queda afuera de las fechas nuevas si se aplica el plan. */
export function quedanAfuera<T extends RangoDeDias>(
  plan: PlanDeReacomodo,
  despues: RangoDeDias,
  ocupacion: readonly T[],
): T[] {
  return ocupacion.filter((rango) => {
    const movido = moverRango(plan, rango);
    return movido === null || !contiene(despues, movido.desde) || !contiene(despues, movido.hasta);
  });
}

/**
 * RN-V2: el primer plan automático que deja todo adentro. Si el viaje se corre semanas enteras sin
 * cambiar de largo, primero se intenta correr todo; si no, primero no mover nada. `null` si ningún
 * plan automático sirve (RN-V3).
 */
export function elegirPlan(
  antes: RangoDeDias,
  despues: RangoDeDias,
  ocupacion: OcupacionDelViaje,
): PlanElegido | null {
  const corrimiento = diasEntre(antes.desde, despues.desde);
  const mismoLargo = diasEntre(antes.hasta, despues.hasta) === corrimiento;
  const armadores = mismoLargo
    ? [planCorriendoSemanas, planSinCambios]
    : [planSinCambios, planCorriendoSemanas];
  for (const armar of armadores) {
    const plan = armar(antes, despues);
    if (plan && quedanAfuera(plan, despues, ocupacion).length === 0) {
      return { plan, semanas: armar === planSinCambios ? 0 : corrimiento / 7 };
    }
  }
  return null;
}

/** RN-V5: valida los destinos efectivos, incluidos los días omitidos que conservan su fecha. */
export const planDiasQueQuedan: ArmadorDePlan = (antes, despues, eleccion) => {
  if (!eleccion || Object.keys(eleccion).length > 367) return null;
  if (Object.keys(eleccion).some((d) => !contiene(antes, d))) return null;
  const destinos = new Set<string>();
  for (let dia = antes.desde; dia <= antes.hasta; dia = sumarDias(dia, 1)) {
    const destino = moverDia(eleccion, dia);
    if (destino === null) continue;
    if (!contiene(despues, destino)) {
      // Un día omitido que queda fuera se aparta; un destino explícito inválido se rechaza.
      if (Object.hasOwn(eleccion, dia)) return null;
      continue;
    }
    if (destinos.has(destino)) return null;
    destinos.add(destino);
  }
  return { ...eleccion };
};
