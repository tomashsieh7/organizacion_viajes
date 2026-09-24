import type { AccionSobrePropuesta, EstadoPropuesta, ValorVoto } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../compartido/errores.js';
import type { Coordenadas } from '../../../compartido/valores/coordenadas.js';

export type TipoPropuesta = 'ACTIVIDAD' | 'ALOJAMIENTO';

export interface Voto {
  usuarioId: string;
  valor: ValorVoto;
  emitidoEn: Date;
}

export interface DatosPropuesta {
  id: string;
  viajeId: string;
  autorId: string;
  tipo: TipoPropuesta;
  descripcion: string;
  precio: number | null;
  ubicacion: string;
  latitud: number | null;
  longitud: number | null;
  estado: EstadoPropuesta;
  resueltaPorId: string | null;
  resueltaEn: Date | null;
  creadaEn: Date;
  votos: Voto[];
}

/**
 * RN-R1: transiciones válidas. DENEGADA y CANCELADA son finales (P7). Con cuatro estados y tres
 * transiciones, una tabla es más clara que una clase por estado (patrón State descartado, 2.2.3).
 */
const TRANSICIONES: Record<
  EstadoPropuesta,
  Partial<Record<AccionSobrePropuesta, EstadoPropuesta>>
> = {
  PENDIENTE: { confirmar: 'CONFIRMADA', denegar: 'DENEGADA' },
  CONFIRMADA: { cancelar: 'CANCELADA' },
  DENEGADA: {},
  CANCELADA: {},
};

/**
 * Propuesta de alojamiento o de actividad: es la experta en su estado y en sus votos (GRASP).
 * Los datos propios de cada tipo viven en su módulo.
 */
export class Propuesta {
  private constructor(private datos: DatosPropuesta) {}

  static proponer(datos: {
    id: string;
    viajeId: string;
    autorId: string;
    tipo: TipoPropuesta;
    descripcion: string;
    precio?: number | undefined;
    ubicacion: string;
    coordenadas: Coordenadas | null;
    ahora: Date;
  }): Propuesta {
    if (datos.precio !== undefined && (!Number.isSafeInteger(datos.precio) || datos.precio < 0)) {
      throw new ErrorDeDominio('VALIDACION', 'PRECIO_INVALIDO', 'El precio no puede ser negativo');
    }
    return new Propuesta({
      id: datos.id,
      viajeId: datos.viajeId,
      autorId: datos.autorId,
      tipo: datos.tipo,
      descripcion: datos.descripcion,
      precio: datos.precio ?? null,
      ubicacion: datos.ubicacion,
      latitud: datos.coordenadas?.latitud ?? null,
      longitud: datos.coordenadas?.longitud ?? null,
      estado: 'PENDIENTE',
      resueltaPorId: null,
      resueltaEn: null,
      creadaEn: datos.ahora,
      votos: [],
    });
  }

  static reconstruir(datos: DatosPropuesta): Propuesta {
    return new Propuesta({ ...datos, votos: datos.votos.map((v) => ({ ...v })) });
  }

  get id() {
    return this.datos.id;
  }
  get viajeId() {
    return this.datos.viajeId;
  }
  get tipo() {
    return this.datos.tipo;
  }
  get estado() {
    return this.datos.estado;
  }

  /** RN-X3: un voto por viajero; votar de nuevo reemplaza el valor. Quien propone también vota (P7). */
  votar(usuarioId: string, valor: ValorVoto, ahora: Date): void {
    this.exigirPendiente();
    this.datos.votos = [
      ...this.datos.votos.filter((v) => v.usuarioId !== usuarioId),
      { usuarioId, valor, emitidoEn: ahora },
    ];
  }

  /** P6: retira el voto propio de una propuesta pendiente. */
  desvotar(usuarioId: string): void {
    this.exigirPendiente();
    if (!this.datos.votos.some((v) => v.usuarioId === usuarioId)) {
      throw new ErrorDeDominio('NO_ENCONTRADO', 'SIN_VOTO', 'No votaste esta propuesta');
    }
    this.datos.votos = this.datos.votos.filter((v) => v.usuarioId !== usuarioId);
  }

  /** RN-R1 y RN-R2: el Admin resuelve libremente, sin umbral de votos. */
  resolver(accion: AccionSobrePropuesta, adminId: string, ahora: Date): void {
    const destino = TRANSICIONES[this.datos.estado][accion];
    if (!destino) {
      throw new ErrorDeDominio(
        'CONFLICTO',
        'TRANSICION_INVALIDA',
        `No se puede ${accion} una propuesta ${this.datos.estado.toLowerCase()}`,
      );
    }
    this.datos = { ...this.datos, estado: destino, resueltaPorId: adminId, resueltaEn: ahora };
  }

  conteo(): { aFavor: number; enContra: number } {
    return {
      aFavor: this.datos.votos.filter((v) => v.valor === 'A_FAVOR').length,
      enContra: this.datos.votos.filter((v) => v.valor === 'EN_CONTRA').length,
    };
  }

  aDatos(): DatosPropuesta {
    return { ...this.datos, votos: this.datos.votos.map((v) => ({ ...v })) };
  }

  private exigirPendiente(): void {
    if (this.datos.estado !== 'PENDIENTE') {
      throw new ErrorDeDominio(
        'CONFLICTO',
        'PROPUESTA_NO_PENDIENTE',
        'La propuesta ya fue resuelta',
      );
    }
  }
}
