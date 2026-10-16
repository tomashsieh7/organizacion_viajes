import { Dinero } from '../../../comun/valores/dinero.js';
import type { EstrategiaDivision, ParteDeGasto } from './estrategiaDivision.js';

/** Partes iguales; las unidades que sobran van a los primeros de la lista (P13, D16). */
export class DivisionEnPartesIguales implements EstrategiaDivision {
  readonly modo = 'IGUALES' as const;

  dividir(total: Dinero, deudores: string[]): ParteDeGasto[] {
    return total.repartir(deudores.length).map((monto, i) => ({ usuarioId: deudores[i]!, monto }));
  }
}
