import { describe, expect, it } from 'vitest';
import { destinoTrasIngresar } from '../src/utiles/navegacion';

describe('destinoTrasIngresar', () => {
  it('vuelve a la ruta interna que se pidió', () => {
    expect(destinoTrasIngresar('/viajes/v1/gastos')).toBe('/viajes/v1/gastos');
    expect(destinoTrasIngresar('/viajes/v1/mapa?dia=2026-12-11')).toBe(
      '/viajes/v1/mapa?dia=2026-12-11',
    );
  });

  it('descarta lo que no es una ruta interna y lleva a la lista de viajes', () => {
    for (const volver of [
      undefined,
      ['/viajes/v1'],
      'https://otro-sitio.com',
      '//otro-sitio.com/x',
      '/\\otro-sitio.com',
      'javascript:alert(1)',
      'viajes',
    ]) {
      expect(destinoTrasIngresar(volver)).toBe('/viajes');
    }
  });
});
