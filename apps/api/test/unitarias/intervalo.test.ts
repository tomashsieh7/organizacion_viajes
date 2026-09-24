import { describe, expect, it } from 'vitest';
import { Intervalo } from '../../src/compartido/valores/intervalo.js';

const act = (fecha: string, hora: string, duracion: number) =>
  Intervalo.deActividad(fecha, hora, duracion);

describe('Intervalo (RN-A2)', () => {
  const kayak = act('2026-12-11', '10:00', 120); // 10:00 a 12:00

  it('dos intervalos contiguos no se superponen', () => {
    expect(kayak.seSuperponeCon(act('2026-12-11', '12:00', 60))).toBe(false);
    expect(kayak.seSuperponeCon(act('2026-12-11', '09:00', 60))).toBe(false);
  });

  it('se superponen si se cruzan parcialmente o uno contiene al otro', () => {
    expect(kayak.seSuperponeCon(act('2026-12-11', '11:59', 30))).toBe(true);
    expect(kayak.seSuperponeCon(act('2026-12-11', '10:30', 30))).toBe(true);
    expect(kayak.seSuperponeCon(act('2026-12-11', '08:00', 600))).toBe(true);
  });

  it('una actividad que pasa la medianoche choca con otra de la madrugada siguiente', () => {
    const salida = act('2026-12-11', '23:00', 180); // hasta las 02:00 del 12
    expect(salida.seSuperponeCon(act('2026-12-12', '01:00', 60))).toBe(true);
    expect(salida.seSuperponeCon(act('2026-12-12', '02:00', 60))).toBe(false);
  });

  it('actividades de días distintos a la misma hora no se superponen', () => {
    expect(kayak.seSuperponeCon(act('2026-12-12', '10:00', 120))).toBe(false);
  });

  it('rechaza horas y duraciones inválidas', () => {
    expect(() => act('2026-12-11', '24:00', 30)).toThrow(
      expect.objectContaining({ codigo: 'HORA_INVALIDA' }),
    );
    expect(() => act('2026-12-11', '10:00', 0)).toThrow(
      expect.objectContaining({ codigo: 'DURACION_INVALIDA' }),
    );
  });
});
