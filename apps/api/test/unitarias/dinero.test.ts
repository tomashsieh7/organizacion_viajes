import { describe, expect, it } from 'vitest';
import { Dinero } from '../../src/compartido/valores/dinero.js';

const ars = (monto: number) => Dinero.de(monto, 'ARS');

describe('Dinero', () => {
  it('RN-G4: reparte con resto asignando las unidades sobrantes a las primeras partes', () => {
    expect(
      ars(1000)
        .repartir(3)
        .map((d) => d.monto),
    ).toEqual([334, 333, 333]);
    expect(
      ars(10)
        .repartir(4)
        .map((d) => d.monto),
    ).toEqual([3, 3, 2, 2]);
  });

  it('el reparto siempre suma el total', () => {
    for (const [monto, partes] of [
      [1, 3],
      [999_999, 7],
      [0, 5],
      [1_234_567, 13],
    ] as const) {
      const suma = Dinero.sumarTodos(ars(monto).repartir(partes), 'ARS');
      expect(suma.monto).toBe(monto);
    }
  });

  it('rechaza montos no enteros', () => {
    expect(() => ars(10.5)).toThrow(expect.objectContaining({ codigo: 'MONTO_INVALIDO' }));
  });

  it('rechaza repartir en cero partes o repartir un monto negativo', () => {
    expect(() => ars(10).repartir(0)).toThrow(
      expect.objectContaining({ codigo: 'PARTES_INVALIDAS' }),
    );
    expect(() => ars(-10).repartir(2)).toThrow(
      expect.objectContaining({ codigo: 'MONTO_INVALIDO' }),
    );
  });

  it('suma, resta y compara dentro de la misma moneda', () => {
    expect(ars(10).sumar(ars(5)).monto).toBe(15);
    expect(ars(10).restar(ars(15)).monto).toBe(-5);
    expect(ars(10).esMayorQue(ars(5))).toBe(true);
    expect(ars(10).menorEntre(ars(5)).monto).toBe(5);
    expect(ars(0).esCero()).toBe(true);
  });

  it('no combina monedas distintas', () => {
    expect(() => ars(10).sumar(Dinero.de(1, 'USD'))).toThrow(
      expect.objectContaining({ codigo: 'MONEDAS_DISTINTAS' }),
    );
  });
});
