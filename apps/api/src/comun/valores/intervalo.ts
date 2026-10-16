import { ErrorDeDominio } from '../errores.js';
import { exigirFecha, type Fecha } from './fecha.js';

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Intervalo de tiempo semiabierto [inicio, fin) en minutos, en la hora local del destino (D17).
 * Que sea semiabierto hace que una actividad que termina a las 12:00 no se superponga con otra
 * que empieza a las 12:00.
 */
export class Intervalo {
  private constructor(
    readonly inicio: number,
    readonly fin: number,
  ) {}

  /** Intervalo de una actividad a partir de su fecha, su hora de inicio `HH:mm` y su duración. */
  static deActividad(fecha: Fecha, horaInicio: string, duracionMin: number): Intervalo {
    exigirFecha(fecha);
    const hora = HORA.exec(horaInicio);
    if (!hora) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'HORA_INVALIDA',
        `"${horaInicio}" no es una hora válida`,
      );
    }
    if (!Number.isInteger(duracionMin) || duracionMin <= 0) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'DURACION_INVALIDA',
        'La duración debe ser mayor que cero',
      );
    }
    const dia = Date.parse(`${fecha}T00:00:00Z`) / 60_000;
    const inicio = dia + Number(hora[1]) * 60 + Number(hora[2]);
    return new Intervalo(inicio, inicio + duracionMin);
  }

  seSuperponeCon(otro: Intervalo): boolean {
    return this.inicio < otro.fin && otro.inicio < this.fin;
  }
}
