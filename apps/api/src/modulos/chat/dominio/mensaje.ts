import { ErrorDeDominio } from '../../../compartido/errores.js';

export const LARGO_MAXIMO_MENSAJE = 2000;

export interface DatosMensaje {
  id: string;
  viajeId: string;
  autorId: string;
  contenido: string;
  enviadoEn: Date;
}

/** Mensaje del chat del viaje (CU19). Es el experto en qué contenido es válido. */
export class Mensaje {
  private constructor(private readonly datos: DatosMensaje) {}

  static escribir(datos: {
    id: string;
    viajeId: string;
    autorId: string;
    contenido: string;
    ahora: Date;
  }): Mensaje {
    const contenido = datos.contenido.trim();
    if (contenido.length === 0 || contenido.length > LARGO_MAXIMO_MENSAJE) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'MENSAJE_INVALIDO',
        `El mensaje tiene que tener entre 1 y ${LARGO_MAXIMO_MENSAJE} caracteres`,
      );
    }
    return new Mensaje({
      id: datos.id,
      viajeId: datos.viajeId,
      autorId: datos.autorId,
      contenido,
      enviadoEn: datos.ahora,
    });
  }

  get id() {
    return this.datos.id;
  }

  aDatos(): DatosMensaje {
    return { ...this.datos };
  }
}
