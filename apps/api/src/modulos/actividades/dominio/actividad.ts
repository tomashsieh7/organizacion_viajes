import { moverDia, type PlanDeReacomodo } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { Coordenadas } from '../../../comun/valores/coordenadas.js';
import type { Fecha } from '../../../comun/valores/fecha.js';
import { Intervalo } from '../../../comun/valores/intervalo.js';
import { RangoFechas } from '../../../comun/valores/rangoFechas.js';
import { Propuesta } from '../../propuestas/dominio/propuesta.js';

export interface DetalleActividad {
  titulo: string;
  fecha: Fecha | null;
  horaInicio: string;
  duracionMin: number;
  /** Actividad original de la que esta es alternativa, o null si es una original (P9). */
  alternativaDeId: string | null;
  fechaCambiadaEn?: Date | null;
}

export interface DatosNuevaActividad {
  id: string;
  viajeId: string;
  autorId: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  coordenadas: Coordenadas;
  precio?: number | undefined;
  fecha: Fecha;
  horaInicio: string;
  duracionMin: number;
  ahora: Date;
}

/**
 * Actividad: una propuesta con fecha, horario y duración. Es la experta en su intervalo y en
 * cómo se crean sus alternativas (GRASP: experto en información y creador).
 */
export class Actividad {
  private constructor(
    readonly propuesta: Propuesta,
    readonly detalle: DetalleActividad,
  ) {
    detalle.fechaCambiadaEn ??= null;
    Intervalo.deActividad(detalle.fecha ?? '2000-01-01', detalle.horaInicio, detalle.duracionMin); // valida horario y duración
  }

  /** RN-A1 y RN-A3: se guarda pendiente de votación. */
  static proponer(datos: DatosNuevaActividad): Actividad {
    return Actividad.armar(datos, null);
  }

  static reconstruir(propuesta: Propuesta, detalle: DetalleActividad): Actividad {
    return new Actividad(propuesta, { ...detalle });
  }

  get id() {
    return this.propuesta.id;
  }

  get intervalo(): Intervalo {
    if (this.detalle.fecha === null)
      throw new ErrorDeDominio('CONFLICTO', 'SIN_DIA', 'Ubicá la propuesta antes de confirmarla');
    return Intervalo.deActividad(
      this.detalle.fecha,
      this.detalle.horaInicio,
      this.detalle.duracionMin,
    );
  }

  /** RN-V2: el rango de un solo día que la actividad ocupa en el viaje. */
  get dias(): RangoFechas | null {
    if (this.detalle.fecha === null) return null;
    return RangoFechas.crear(this.detalle.fecha, this.detalle.fecha);
  }

  get titulo(): string {
    return this.detalle.titulo;
  }

  /** RN-V2: pasa al día que el plan le asigna, con el mismo horario, votos y estado. */
  reacomodar(plan: PlanDeReacomodo, ahora = new Date()): void {
    if (this.detalle.fecha !== null) this.ubicar(moverDia(plan, this.detalle.fecha), ahora);
  }

  ubicar(fecha: string | null, ahora: Date): void {
    if (fecha !== null)
      Intervalo.deActividad(fecha, this.detalle.horaInicio, this.detalle.duracionMin);
    if (fecha !== this.detalle.fecha) {
      this.detalle.fecha = fecha;
      this.detalle.fechaCambiadaEn = ahora;
    }
  }

  get intervaloAgendado(): Intervalo | null {
    return this.detalle.fecha === null ? null : this.intervalo;
  }

  /** Id que identifica al grupo de opciones: el de la original. */
  get grupo(): string {
    return this.detalle.alternativaDeId ?? this.id;
  }

  /**
   * RN-B1 y RN-B3 (P9): solo sobre actividades pendientes, y siempre vinculada a la original,
   * así no se forman cadenas de alternativas.
   */
  crearAlternativa(datos: Omit<DatosNuevaActividad, 'viajeId'>): Actividad {
    if (this.propuesta.estado !== 'PENDIENTE') {
      throw new ErrorDeDominio(
        'CONFLICTO',
        'ORIGINAL_NO_PENDIENTE',
        'Solo se proponen alternativas a actividades pendientes de votación',
      );
    }
    return Actividad.armar({ ...datos, viajeId: this.propuesta.viajeId }, this.grupo);
  }

  private static armar(datos: DatosNuevaActividad, alternativaDeId: string | null): Actividad {
    const propuesta = Propuesta.proponer({
      id: datos.id,
      viajeId: datos.viajeId,
      autorId: datos.autorId,
      tipo: 'ACTIVIDAD',
      descripcion: datos.descripcion,
      precio: datos.precio,
      ubicacion: datos.ubicacion,
      coordenadas: datos.coordenadas,
      ahora: datos.ahora,
    });
    return new Actividad(propuesta, {
      titulo: datos.titulo,
      fecha: datos.fecha,
      horaInicio: datos.horaInicio,
      duracionMin: datos.duracionMin,
      alternativaDeId,
    });
  }
}
