import { ErrorDeDominio } from '../../../compartido/errores.js';
import type { Coordenadas } from '../../../compartido/valores/coordenadas.js';
import type { Fecha } from '../../../compartido/valores/fecha.js';
import { Intervalo } from '../../../compartido/valores/intervalo.js';
import { Propuesta } from '../../propuestas/dominio/propuesta.js';

export interface DetalleActividad {
  titulo: string;
  fecha: Fecha;
  horaInicio: string;
  duracionMin: number;
  /** Actividad original de la que esta es alternativa, o null si es una original (P9). */
  alternativaDeId: string | null;
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
    Intervalo.deActividad(detalle.fecha, detalle.horaInicio, detalle.duracionMin); // valida horario y duración
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
    return Intervalo.deActividad(
      this.detalle.fecha,
      this.detalle.horaInicio,
      this.detalle.duracionMin,
    );
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
