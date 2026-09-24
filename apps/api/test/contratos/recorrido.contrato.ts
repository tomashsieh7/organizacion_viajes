import { describe, expect, it } from 'vitest';
import type { ProveedorRecorrido } from '../../src/modulos/itinerario/dominio/recorrido.js';

const A = { latitud: -41.13, longitud: -71.31 };
const B = { latitud: -41.08, longitud: -71.55 };
const C = { latitud: -41.16, longitud: -71.4 };

/**
 * Contrato de `ProveedorRecorrido` (RN-M6). Una implementación que siga calles puede agregar
 * puntos intermedios, pero tiene que empezar y terminar en las actividades y pasar por todas en
 * el orden dado.
 */
export function probarContratoProveedorRecorrido(nombre: string, crear: () => ProveedorRecorrido) {
  describe(`ProveedorRecorrido — ${nombre}`, () => {
    it('sin actividades no hay recorrido, y con una sola es ese punto', async () => {
      expect(await crear().trazar([])).toEqual([]);
      expect(await crear().trazar([A])).toEqual([A]);
    });

    it('empieza en la primera, termina en la última y pasa por todas en orden', async () => {
      const recorrido = await crear().trazar([A, B, C]);
      expect(recorrido[0]).toEqual(A);
      expect(recorrido.at(-1)).toEqual(C);
      let desde = 0;
      for (const punto of [A, B, C]) {
        const i = recorrido.findIndex(
          (p, j) => j >= desde && p.latitud === punto.latitud && p.longitud === punto.longitud,
        );
        expect(i).toBeGreaterThanOrEqual(desde);
        desde = i;
      }
    });

    it('devuelve solo coordenadas, aunque reciba objetos con más datos', async () => {
      const [p] = await crear().trazar([{ ...A, titulo: 'Kayak' } as typeof A]);
      expect(Object.keys(p!).sort()).toEqual(['latitud', 'longitud']);
    });
  });
}
