import { describe, expect, it } from 'vitest';
import { RangoFechas } from '../../src/compartido/valores/rangoFechas.js';
import { esFechaValida } from '../../src/compartido/valores/fecha.js';

const viaje = RangoFechas.crear('2026-12-10', '2026-12-16');

describe('RangoFechas', () => {
  it('RN-X4: incluye ambos extremos del viaje y excluye los días de afuera', () => {
    expect(viaje.contiene('2026-12-10')).toBe(true);
    expect(viaje.contiene('2026-12-16')).toBe(true);
    expect(viaje.contiene('2026-12-09')).toBe(false);
    expect(viaje.contiene('2026-12-17')).toBe(false);
  });

  it('contiene un rango solo si está completo adentro', () => {
    expect(viaje.contiene(RangoFechas.crear('2026-12-10', '2026-12-16'))).toBe(true);
    expect(viaje.contiene(RangoFechas.crear('2026-12-09', '2026-12-12'))).toBe(false);
    expect(viaje.contiene(RangoFechas.crear('2026-12-15', '2026-12-17'))).toBe(false);
  });

  it('RN-C3: cuenta la noche del día de entrada y no la del día de salida', () => {
    const alojamiento = RangoFechas.crear('2026-12-10', '2026-12-13');
    expect(alojamiento.incluyeNoche('2026-12-10')).toBe(true);
    expect(alojamiento.incluyeNoche('2026-12-12')).toBe(true);
    expect(alojamiento.incluyeNoche('2026-12-13')).toBe(false);
  });

  it('RN-C1: lista todos los días del rango, incluso cruzando de mes', () => {
    expect(RangoFechas.crear('2026-12-30', '2027-01-02').dias()).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
  });

  it('rechaza rangos invertidos y fechas inexistentes', () => {
    expect(() => RangoFechas.crear('2026-12-16', '2026-12-10')).toThrow(
      expect.objectContaining({ codigo: 'RANGO_FECHAS_INVALIDO' }),
    );
    expect(() => RangoFechas.crear('2026-02-30', '2026-03-01')).toThrow(
      expect.objectContaining({ codigo: 'FECHA_INVALIDA' }),
    );
    expect(esFechaValida('2028-02-29')).toBe(true);
    expect(esFechaValida('10/12/2026')).toBe(false);
  });
});
