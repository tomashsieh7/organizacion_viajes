import { ErrorDeDominio } from '../errores.js';
import { exigirFecha, sumarDias, type Fecha } from './fecha.js';

/** Rango de días calendario con ambos extremos incluidos. */
export class RangoFechas {
  private constructor(
    readonly desde: Fecha,
    readonly hasta: Fecha,
  ) {}

  static crear(desde: string, hasta: string): RangoFechas {
    const d = exigirFecha(desde);
    const h = exigirFecha(hasta);
    if (d > h) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'RANGO_FECHAS_INVALIDO',
        'La fecha de inicio no puede ser posterior a la de fin',
      );
    }
    return new RangoFechas(d, h);
  }

  /** Si un día, u otro rango completo, cae dentro de este rango (P11). */
  contiene(valor: Fecha | RangoFechas): boolean {
    if (valor instanceof RangoFechas) return this.desde <= valor.desde && valor.hasta <= this.hasta;
    return this.desde <= valor && valor <= this.hasta;
  }

  /**
   * Si la noche de `dia` se pasa en este alojamiento: el día de entrada cuenta y el de salida
   * no (RN-C3).
   */
  incluyeNoche(dia: Fecha): boolean {
    return this.desde <= dia && dia < this.hasta;
  }

  /** Todos los días del rango, en orden. */
  dias(): Fecha[] {
    const resultado: Fecha[] = [];
    for (let d = this.desde; d <= this.hasta; d = sumarDias(d, 1)) resultado.push(d);
    return resultado;
  }
}
