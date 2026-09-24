import { describe, expect, it } from 'vitest';
import { Dinero } from '../../src/compartido/valores/dinero.js';
import type { EstrategiaDivision } from '../../src/modulos/gastos/dominio/division.js';

/**
 * Contrato de `EstrategiaDivision` (RN-G4). `crear` arma una estrategia válida para ese total y
 * esos deudores; cualquier modo nuevo tiene que cumplirlo para que `Gasto` lo use sin cambios.
 */
export function probarContratoEstrategiaDivision(
  nombre: string,
  crear: (total: number, deudores: string[]) => EstrategiaDivision,
) {
  describe(`EstrategiaDivision — ${nombre}`, () => {
    const casos: [number, string[]][] = [
      [1000, ['a', 'b', 'c']],
      [1, ['a', 'b']],
      [999_999, ['a']],
      [2, ['a', 'b', 'c', 'd']],
    ];

    it('devuelve una parte por deudor, en el mismo orden y en la misma moneda', () => {
      for (const [total, deudores] of casos) {
        const partes = crear(total, deudores).dividir(Dinero.de(total, 'ARS'), deudores);
        expect(partes.map((p) => p.usuarioId)).toEqual(deudores);
        expect(partes.every((p) => p.monto.moneda === 'ARS' && p.monto.monto >= 0)).toBe(true);
      }
    });

    it('las partes suman exactamente el total', () => {
      for (const [total, deudores] of casos) {
        const partes = crear(total, deudores).dividir(Dinero.de(total, 'ARS'), deudores);
        expect(partes.reduce((s, p) => s + p.monto.monto, 0)).toBe(total);
      }
    });
  });
}
