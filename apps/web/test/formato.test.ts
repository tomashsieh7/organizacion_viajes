import { describe, expect, it } from 'vitest';
import { aUnidadMinima, formatearMonto } from '../src/utiles/formato';

describe('aUnidadMinima', () => {
  it('interpreta montos escritos en castellano', () => {
    expect(aUnidadMinima('48000', 2)).toBe(4_800_000);
    expect(aUnidadMinima('48000,5', 2)).toBe(4_800_050);
    expect(aUnidadMinima('48.000,50', 2)).toBe(4_800_050);
    expect(aUnidadMinima('48.000', 2)).toBe(4_800_000);
    expect(aUnidadMinima('48.5', 2)).toBe(4_850);
    expect(aUnidadMinima('1500', 0)).toBe(1500);
  });

  it('rechaza textos que no son montos o con más decimales que la moneda', () => {
    for (const t of ['', 'abc', '-5', '1,234', '10,5']) {
      expect(aUnidadMinima(t, t === '10,5' ? 0 : 2)).toBeNull();
    }
  });

  it('formatea según los decimales de la moneda', () => {
    expect(formatearMonto(150_000, { codigo: 'ARS', nombre: '', decimales: 2 })).toMatch(
      /\$\s?1\.500,00/,
    );
    expect(formatearMonto(1500, { codigo: 'CLP', nombre: '', decimales: 0 })).toMatch(/1\.500/);
  });
});
