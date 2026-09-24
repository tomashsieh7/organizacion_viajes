import { describe, expect, it } from 'vitest';
import { RecorridoEnLineaRecta } from '../../src/modulos/itinerario/dominio/recorrido.js';
import { probarContratoProveedorRecorrido } from './recorrido.contrato.js';

probarContratoProveedorRecorrido('líneas rectas', () => new RecorridoEnLineaRecta());

describe('RecorridoEnLineaRecta (P20)', () => {
  it('une los puntos exactamente en el orden dado, sin agregar intermedios', async () => {
    const puntos = [
      { latitud: 1, longitud: 1 },
      { latitud: 2, longitud: 2 },
      { latitud: 0, longitud: 3 },
    ];
    expect(await new RecorridoEnLineaRecta().trazar(puntos)).toEqual(puntos);
  });
});
