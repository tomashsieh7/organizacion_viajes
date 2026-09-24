import { describe, expect, it } from 'vitest';
import {
  BuscadorNominatim,
  type BuscadorUbicaciones,
  type Ubicacion,
} from '../src/clientes/ubicaciones';

/** Contrato de BuscadorUbicaciones (D8): lo cumplen la implementación falsa y el adaptador de Nominatim. */
function probarContrato(nombre: string, crear: () => BuscadorUbicaciones) {
  describe(`Contrato de BuscadorUbicaciones — ${nombre}`, () => {
    it('con menos de 3 caracteres no busca', async () => {
      expect(await crear().buscar('ba')).toEqual([]);
      expect(await crear().buscar('   ')).toEqual([]);
    });

    it('devuelve hasta 5 lugares con nombre y coordenadas válidas', async () => {
      const resultados = await crear().buscar('Bariloche');
      expect(resultados.length).toBeGreaterThan(0);
      expect(resultados.length).toBeLessThanOrEqual(5);
      for (const r of resultados) {
        expect(r.nombre).not.toBe('');
        expect(r.latitud).toBeGreaterThanOrEqual(-90);
        expect(r.latitud).toBeLessThanOrEqual(90);
        expect(r.longitud).toBeGreaterThanOrEqual(-180);
        expect(r.longitud).toBeLessThanOrEqual(180);
      }
    });
  });
}

class BuscadorFalso implements BuscadorUbicaciones {
  async buscar(texto: string): Promise<Ubicacion[]> {
    return texto.trim().length < 3
      ? []
      : [{ nombre: `${texto}, Río Negro`, latitud: -41.13, longitud: -71.31 }];
  }
}

// Respuesta grabada de Nominatim (la red de pruebas no llega al servicio real).
const RESPUESTA_NOMINATIM = Array.from({ length: 7 }, (_, i) => ({
  place_id: i,
  display_name: `San Carlos de Bariloche ${i}, Río Negro, Argentina`,
  lat: String(-41.13 - i / 100),
  lon: String(-71.31 + i / 100),
}));

const pedidos: string[] = [];
const fetchGrabado = (async (url: string) => {
  pedidos.push(String(url));
  return new Response(JSON.stringify(RESPUESTA_NOMINATIM), { status: 200 });
}) as unknown as typeof fetch;

probarContrato('falso', () => new BuscadorFalso());
probarContrato('Nominatim con respuesta grabada', () => new BuscadorNominatim(fetchGrabado));

describe('BuscadorNominatim', () => {
  it('pide JSON en castellano, limitado a 5 resultados, y convierte las coordenadas', async () => {
    pedidos.length = 0;
    const [primero] = await new BuscadorNominatim(fetchGrabado).buscar('  Bariloche ');
    const url = new URL(pedidos[0]!);
    expect(url.pathname).toBe('/search');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      q: 'Bariloche',
      format: 'jsonv2',
      limit: '5',
      'accept-language': 'es',
    });
    expect(primero).toEqual({
      nombre: 'San Carlos de Bariloche 0, Río Negro, Argentina',
      latitud: -41.13,
      longitud: -71.31,
    });
  });

  it('avisa si el servicio no responde bien', async () => {
    const caido = (async () => new Response('', { status: 503 })) as unknown as typeof fetch;
    await expect(new BuscadorNominatim(caido).buscar('Bariloche')).rejects.toThrow('no respondió');
  });
});
