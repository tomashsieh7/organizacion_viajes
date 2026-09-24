import { describe, expect, it } from 'vitest';
import { pasaLaMedianoche, sumarMinutos } from '@viajes/compartido';

describe('sumarMinutos y pasaLaMedianoche', () => {
  it('suma dentro del mismo día', () => {
    expect(sumarMinutos('10:00', 150)).toBe('12:30');
    expect(pasaLaMedianoche('10:00', 150)).toBe(false);
  });

  it('da vuelta después de la medianoche', () => {
    expect(sumarMinutos('23:30', 90)).toBe('01:00');
    expect(pasaLaMedianoche('23:30', 90)).toBe(true);
  });

  it('terminar justo a las 00:00 no cuenta como día siguiente', () => {
    expect(sumarMinutos('23:00', 60)).toBe('00:00');
    expect(pasaLaMedianoche('23:00', 60)).toBe(false);
  });
});
