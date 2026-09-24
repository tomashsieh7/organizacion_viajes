import type { ModoDivision } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../compartido/errores.js';
import { Dinero } from '../../../compartido/valores/dinero.js';
import type { EstrategiaDivision, ParteDeGasto } from './division.js';

export interface DatosGasto {
  id: string;
  viajeId: string;
  titulo: string;
  categoriaId: string;
  monto: Dinero;
  modoDivision: ModoDivision;
  pagadoPorId: string;
  registradoPorId: string;
  creadoEn: Date;
  partes: ParteDeGasto[];
}

/** Lo que una parte agrega a la deuda de un viajero con el pagador (RN-G6). */
export interface DeudaGenerada {
  deudorId: string;
  acreedorId: string;
  monto: Dinero;
}

/** Gasto del viaje con su división (CU20). Crea sus partes con la estrategia elegida (GRASP: Creador). */
export class Gasto {
  private constructor(private readonly datos: DatosGasto) {}

  /** RN-G1 a RN-G5. */
  static anotar(datos: {
    id: string;
    viajeId: string;
    titulo: string;
    categoriaId: string;
    monto: Dinero;
    pagadoPorId: string;
    registradoPorId: string;
    deudores: string[];
    division: EstrategiaDivision;
    ahora: Date;
  }): Gasto {
    if (!datos.monto.esPositivo()) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'MONTO_INVALIDO',
        'El monto tiene que ser mayor que cero',
      );
    }
    if (datos.deudores.length === 0 || new Set(datos.deudores).size !== datos.deudores.length) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'DEUDORES_INVALIDOS',
        'Elegí al menos una persona, sin repetir',
      );
    }
    const partes = datos.division.dividir(datos.monto, datos.deudores);
    // La estrategia garantiza que las partes suman el total; se verifica igual porque es un invariante del gasto.
    const suma = Dinero.sumarTodos(
      partes.map((p) => p.monto),
      datos.monto.moneda,
    );
    if (!suma.equals(datos.monto)) throw new Error('Las partes no suman el total del gasto');
    return new Gasto({
      id: datos.id,
      viajeId: datos.viajeId,
      titulo: datos.titulo,
      categoriaId: datos.categoriaId,
      monto: datos.monto,
      modoDivision: datos.division.modo,
      pagadoPorId: datos.pagadoPorId,
      registradoPorId: datos.registradoPorId,
      creadoEn: datos.ahora,
      partes,
    });
  }

  get id() {
    return this.datos.id;
  }

  /** RN-G6: la parte del pagador no genera deuda; tampoco una parte en cero. */
  deudasGeneradas(): DeudaGenerada[] {
    return this.datos.partes
      .filter((p) => p.usuarioId !== this.datos.pagadoPorId && p.monto.esPositivo())
      .map((p) => ({ deudorId: p.usuarioId, acreedorId: this.datos.pagadoPorId, monto: p.monto }));
  }

  aDatos(): DatosGasto {
    return { ...this.datos, partes: [...this.datos.partes] };
  }
}
