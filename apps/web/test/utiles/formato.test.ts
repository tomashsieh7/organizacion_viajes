import { describe, expect, it } from 'vitest';
import {
  aUnidadMinima,
  formatearDia,
  etiquetaDelDia,
  formatearHora,
  formatearMonto,
  formatearRango,
  simboloMoneda,
} from '../../src/utiles/formato';

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

describe('formatearRango', () => {
  it('no repite el mes ni el año cuando coinciden', () => {
    expect(formatearRango('2026-12-10', '2026-12-16')).toBe('10 al 16 dic 2026');
    expect(formatearRango('2026-11-28', '2026-12-03')).toBe('28 nov al 3 dic 2026');
    expect(formatearRango('2026-12-28', '2027-01-03')).toBe('28 dic 2026 al 3 ene 2027');
    // Un viaje de un solo día no repite el día.
    expect(formatearRango('2026-12-10', '2026-12-10')).toBe('10 dic 2026');
  });
});

describe('formatearDia', () => {
  it('muestra el día de un instante con el mes abreviado, como los rangos', () => {
    // Mediodía UTC: es el mismo día en casi cualquier zona horaria del dispositivo.
    expect(formatearDia('2026-10-14T12:00:00.000Z')).toBe('14 oct 2026');
    expect(formatearDia('2027-01-03T12:00:00.000Z')).toBe('3 ene 2027');
  });
});

describe('formatearHora y etiquetaDelDia', () => {
  const ahora = new Date(2026, 9, 15, 10, 0);
  const en = (dia: number, mes: number, anio = 2026) =>
    new Date(anio, mes, dia, 21, 26).toISOString();

  it('la hora va con 24 horas', () => {
    expect(formatearHora(en(24, 8))).toBe('21:26');
    expect(formatearHora(new Date(2026, 11, 3, 9, 5).toISOString())).toBe('09:05');
  });

  it('el día dice Hoy, Ayer, la fecha corta o la fecha con año', () => {
    expect(etiquetaDelDia(en(15, 9), ahora)).toBe('Hoy');
    expect(etiquetaDelDia(en(14, 9), ahora)).toBe('Ayer');
    expect(etiquetaDelDia(en(24, 8), ahora)).toBe('24 sep');
    expect(etiquetaDelDia(en(30, 11, 2025), ahora)).toBe('30 dic 2025');
  });
});

describe('simboloMoneda', () => {
  it('usa el mismo símbolo que los montos formateados', () => {
    expect(simboloMoneda({ codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 })).toBe('$');
    expect(simboloMoneda({ codigo: 'USD', nombre: 'Dólar', decimales: 2 })).toBe('US$');
  });
});
