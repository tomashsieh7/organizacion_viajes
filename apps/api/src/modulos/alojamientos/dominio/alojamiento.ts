import { moverRango, diasEntre, sumarDias, type PlanDeReacomodo } from '@viajes/compartido';
import { RangoFechas } from '../../../comun/valores/rangoFechas.js';
import type { Propuesta } from '../../propuestas/dominio/propuesta.js';
import type { DetalleAlojamiento } from './puertos.js';

/** Alojamiento: una propuesta con nombre y estadía. Es la experta en cómo se mueve su estadía. */
export class Alojamiento {
  private constructor(
    readonly propuesta: Propuesta,
    private detalle: DetalleAlojamiento,
  ) {}

  static reconstruir(propuesta: Propuesta, detalle: DetalleAlojamiento): Alojamiento {
    return new Alojamiento(propuesta, { ...detalle });
  }

  get id() {
    return this.propuesta.id;
  }

  get titulo(): string {
    return this.detalle.nombre;
  }

  /** RN-V2: los días de la estadía, de la entrada a la salida. */
  get dias(): RangoFechas | null {
    return this.detalle.estadia;
  }

  /** RN-V2: se mueve por su día de entrada y conserva las noches. */
  reacomodar(plan: PlanDeReacomodo, ahora = new Date()): void {
    if (!this.detalle.estadia) return;
    this.ubicar(moverRango(plan, this.detalle.estadia)?.desde ?? null, ahora);
  }

  get noches(): number {
    return this.detalle.estadia
      ? diasEntre(this.detalle.estadia.desde, this.detalle.estadia.hasta)
      : (this.detalle.noches ?? 0);
  }

  get fechaCambiadaEn(): Date | null {
    return this.detalle.fechaCambiadaEn ?? null;
  }

  get intervaloAgendado(): null {
    return null;
  }

  ubicar(fecha: string | null, ahora: Date): void {
    const noches = this.noches;
    if (fecha === (this.detalle.estadia?.desde ?? null)) return;
    this.detalle = {
      ...this.detalle,
      noches,
      estadia: fecha === null ? null : RangoFechas.crear(fecha, sumarDias(fecha, noches)),
      fechaCambiadaEn: ahora,
    };
  }
}
