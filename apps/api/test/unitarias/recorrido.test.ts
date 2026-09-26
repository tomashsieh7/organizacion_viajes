import { describe, expect, it } from 'vitest';
import { recorridoEnLineaRecta } from '../../src/modulos/itinerario/dominio/recorrido.js';

const A = { latitud: -41.13, longitud: -71.31 };
const B = { latitud: -41.08, longitud: -71.55 };
const C = { latitud: -41.16, longitud: -71.4 };

describe('recorridoEnLineaRecta (RN-M6, P20)', () => {
  it('sin actividades no hay recorrido, y con una sola es ese punto', () => {
    expect(recorridoEnLineaRecta([])).toEqual([]);
    expect(recorridoEnLineaRecta([A])).toEqual([A]);
  });

  it('une los puntos exactamente en el orden dado, sin agregar intermedios', () => {
    expect(recorridoEnLineaRecta([A, B, C])).toEqual([A, B, C]);
  });

  it('devuelve solo coordenadas, aunque reciba objetos con más datos', () => {
    const [p] = recorridoEnLineaRecta([{ ...A, titulo: 'Kayak' } as typeof A]);
    expect(Object.keys(p!).sort()).toEqual(['latitud', 'longitud']);
  });
});
