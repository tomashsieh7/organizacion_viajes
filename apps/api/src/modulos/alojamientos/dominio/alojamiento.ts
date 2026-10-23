import { moverRango, type PlanDeReacomodo } from '@viajes/compartido';
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
  get dias(): RangoFechas {
    return this.detalle.estadia;
  }

  /** RN-V2: se mueve por su día de entrada y conserva las noches. */
  reacomodar(plan: PlanDeReacomodo): void {
    const { desde, hasta } = moverRango(plan, this.detalle.estadia);
    this.detalle = { ...this.detalle, estadia: RangoFechas.crear(desde, hasta) };
  }
}
