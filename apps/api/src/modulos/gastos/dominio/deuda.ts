import { ErrorDeDominio } from '../../../compartido/errores.js';
import { Dinero } from '../../../compartido/valores/dinero.js';

export interface DatosDeuda {
  id: string;
  viajeId: string;
  deudorId: string;
  acreedorId: string;
  monto: Dinero;
  ultimaActualizacion: Date;
}

/**
 * Saldo pendiente de un viajero con otro dentro de un viaje (P14). Es la experta en cómo cambia
 * su saldo: sumar lo que corresponde por un gasto y compensarse con la deuda en sentido opuesto.
 */
export class Deuda {
  private constructor(private datos: DatosDeuda) {}

  static reconstruir(datos: DatosDeuda): Deuda {
    return new Deuda({ ...datos });
  }

  get id() {
    return this.datos.id;
  }
  get deudorId() {
    return this.datos.deudorId;
  }
  get acreedorId() {
    return this.datos.acreedorId;
  }
  get monto(): Dinero {
    return this.datos.monto;
  }

  /** RN-G6: suma a la deuda lo que le corresponde al deudor por un gasto. */
  sumar(monto: Dinero, ahora: Date): void {
    if (!monto.esPositivo()) return;
    this.datos = {
      ...this.datos,
      monto: this.datos.monto.sumar(monto),
      ultimaActualizacion: ahora,
    };
  }

  /**
   * P15: compensa esta deuda con la del acreedor hacia el deudor, así entre dos viajeros queda
   * una sola deuda neta. Si A le debe 10.000 a B y B pasa a deberle 4.000 a A, queda A → B 6.000.
   */
  compensarCon(opuesta: Deuda, ahora: Date): void {
    const esOpuesta =
      opuesta.datos.viajeId === this.datos.viajeId &&
      opuesta.deudorId === this.acreedorId &&
      opuesta.acreedorId === this.deudorId;
    if (!esOpuesta) {
      throw new ErrorDeDominio('VALIDACION', 'DEUDA_NO_OPUESTA', 'Las deudas no son del mismo par');
    }
    const comun = this.monto.menorEntre(opuesta.monto);
    if (!comun.esPositivo()) return;
    this.datos = { ...this.datos, monto: this.monto.restar(comun), ultimaActualizacion: ahora };
    opuesta.datos = {
      ...opuesta.datos,
      monto: opuesta.monto.restar(comun),
      ultimaActualizacion: ahora,
    };
  }

  aDatos(): DatosDeuda {
    return { ...this.datos };
  }
}
