import { ErrorDeDominio } from '../../../comun/errores.js';
import { Dinero } from '../../../comun/valores/dinero.js';
import type { EstrategiaDivision, ParteDeGasto } from './estrategiaDivision.js';

/** Cada deudor paga lo que indicó quien anota el gasto; la suma tiene que dar el total. */
export class DivisionArbitraria implements EstrategiaDivision {
  readonly modo = 'ARBITRARIA' as const;

  constructor(private readonly montos: ReadonlyMap<string, number>) {}

  dividir(total: Dinero, deudores: string[]): ParteDeGasto[] {
    const mismosDeudores =
      this.montos.size === deudores.length && deudores.every((d) => this.montos.has(d));
    if (!mismosDeudores) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'PARTES_NO_COINCIDEN',
        'Tiene que haber un monto para cada persona elegida, y solo para ellas',
      );
    }
    const partes = deudores.map((usuarioId) => ({
      usuarioId,
      monto: Dinero.de(this.montos.get(usuarioId)!, total.moneda),
    }));
    if (partes.some((p) => p.monto.monto < 0)) {
      throw new ErrorDeDominio('VALIDACION', 'MONTO_INVALIDO', 'Ninguna parte puede ser negativa');
    }
    const suma = Dinero.sumarTodos(
      partes.map((p) => p.monto),
      total.moneda,
    );
    if (!suma.equals(total)) {
      throw new ErrorDeDominio(
        'REGLA_DE_NEGOCIO',
        'SUMA_NO_COINCIDE',
        'La suma de las partes no coincide con el total del gasto',
        { total: total.monto, suma: suma.monto, diferencia: total.monto - suma.monto },
      );
    }
    return partes;
  }
}
