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

export interface DatosPago {
  id: string;
  deudaId: string;
  registradoPorId: string;
  monto: Dinero;
  fecha: Date;
}

/**
 * Saldo pendiente de un viajero con otro dentro de un viaje (P14). Es la experta en cómo cambia
 * su saldo: sumar lo que corresponde por un gasto, compensarse con la deuda en sentido opuesto y
 * restar los pagos, que forman parte de la deuda (relación "resta" del modelo conceptual).
 */
export class Deuda {
  private readonly pagosNuevos: DatosPago[] = [];

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

  /**
   * CU23 (RN-P3 a RN-P5, P17): resta un pago de la deuda. Solo lo registra el deudor, tiene que
   * ser mayor que cero y no puede superar el saldo; el acreedor no lo confirma.
   */
  registrarPago(datos: {
    id: string;
    monto: Dinero;
    registradoPorId: string;
    ahora: Date;
  }): DatosPago {
    if (datos.registradoPorId !== this.deudorId) {
      throw new ErrorDeDominio(
        'PROHIBIDO',
        'SOLO_EL_DEUDOR',
        'Solo quien debe puede registrar el pago',
      );
    }
    if (!datos.monto.esPositivo()) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'MONTO_INVALIDO',
        'El monto tiene que ser mayor que cero',
      );
    }
    if (datos.monto.esMayorQue(this.monto)) {
      throw new ErrorDeDominio(
        'REGLA_DE_NEGOCIO',
        'PAGO_EXCEDE_DEUDA',
        'El pago supera lo que se debe',
        { saldo: this.monto.monto },
      );
    }
    this.datos = {
      ...this.datos,
      monto: this.monto.restar(datos.monto),
      ultimaActualizacion: datos.ahora,
    };
    const pago: DatosPago = {
      id: datos.id,
      deudaId: this.id,
      registradoPorId: datos.registradoPorId,
      monto: datos.monto,
      fecha: datos.ahora,
    };
    this.pagosNuevos.push(pago);
    return pago;
  }

  /** Pagos registrados desde que se cargó la deuda, para que el repositorio los guarde. */
  pagosSinGuardar(): DatosPago[] {
    return [...this.pagosNuevos];
  }

  aDatos(): DatosDeuda {
    return { ...this.datos };
  }
}
