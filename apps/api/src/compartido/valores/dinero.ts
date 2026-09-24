import { repartirEnPartesIguales } from '@viajes/compartido';
import { ErrorDeDominio } from '../errores.js';

/**
 * Monto de dinero en la unidad mínima de una moneda (centavos para pesos), siempre entero
 * para evitar errores de redondeo (D16). Es inmutable: cada operación devuelve otro valor.
 */
export class Dinero {
  private constructor(
    readonly monto: number,
    readonly moneda: string,
  ) {}

  static de(monto: number, moneda: string): Dinero {
    if (!Number.isSafeInteger(monto)) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'MONTO_INVALIDO',
        'El monto debe ser un número entero',
      );
    }
    return new Dinero(monto, moneda);
  }

  static cero(moneda: string): Dinero {
    return new Dinero(0, moneda);
  }

  sumar(otro: Dinero): Dinero {
    this.exigirMismaMoneda(otro);
    return Dinero.de(this.monto + otro.monto, this.moneda);
  }

  restar(otro: Dinero): Dinero {
    this.exigirMismaMoneda(otro);
    return Dinero.de(this.monto - otro.monto, this.moneda);
  }

  esCero(): boolean {
    return this.monto === 0;
  }

  esPositivo(): boolean {
    return this.monto > 0;
  }

  esMayorQue(otro: Dinero): boolean {
    this.exigirMismaMoneda(otro);
    return this.monto > otro.monto;
  }

  menorEntre(otro: Dinero): Dinero {
    return this.esMayorQue(otro) ? otro : this;
  }

  equals(otro: Dinero): boolean {
    return this.moneda === otro.moneda && this.monto === otro.monto;
  }

  /**
   * Reparte el monto en `partes` porciones que suman exactamente el total. Las unidades
   * que sobran se asignan de a una a las primeras porciones (P13): 1000 en 3 da 334, 333 y 333.
   */
  repartir(partes: number): Dinero[] {
    if (!Number.isInteger(partes) || partes <= 0) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'PARTES_INVALIDAS',
        'Hay que repartir en al menos una parte',
      );
    }
    if (this.monto < 0) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'MONTO_INVALIDO',
        'No se puede repartir un monto negativo',
      );
    }
    return repartirEnPartesIguales(this.monto, partes).map((m) => Dinero.de(m, this.moneda));
  }

  static sumarTodos(montos: Dinero[], moneda: string): Dinero {
    return montos.reduce((total, m) => total.sumar(m), Dinero.cero(moneda));
  }

  private exigirMismaMoneda(otro: Dinero): void {
    if (otro.moneda !== this.moneda) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'MONEDAS_DISTINTAS',
        `No se pueden combinar montos en ${this.moneda} y ${otro.moneda}`,
      );
    }
  }
}
