import type { ModoDivision } from '@viajes/compartido';
import { Dinero } from '../../../comun/valores/dinero.js';

export interface ParteDeGasto {
  usuarioId: string;
  monto: Dinero;
}

/**
 * RN-G4: cómo se reparte el total de un gasto entre los deudores elegidos (Strategy). Un modo de
 * división nuevo es otra implementación, sin tocar `Gasto` ni `AnotarGasto` (abierto/cerrado).
 */
export interface EstrategiaDivision {
  readonly modo: ModoDivision;
  /** Una parte por deudor, en el mismo orden, que suman exactamente el total. */
  dividir(total: Dinero, deudores: string[]): ParteDeGasto[];
}
