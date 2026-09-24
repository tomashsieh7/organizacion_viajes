import type { AccionSobrePropuesta, EstadoPropuesta } from '@viajes/compartido';
import { describe, expect, it } from 'vitest';
import { Coordenadas } from '../../src/compartido/valores/coordenadas.js';
import { Propuesta } from '../../src/modulos/propuestas/dominio/propuesta.js';

const AHORA = new Date('2026-09-24T12:00:00Z');

function nueva(): Propuesta {
  return Propuesta.proponer({
    id: 'p1',
    viajeId: 'v1',
    autorId: 'ana',
    tipo: 'ALOJAMIENTO',
    descripcion: 'Hostel',
    ubicacion: 'Centro',
    coordenadas: null,
    ahora: AHORA,
  });
}

function enEstado(estado: EstadoPropuesta): Propuesta {
  return Propuesta.reconstruir({ ...nueva().aDatos(), estado });
}

describe('Propuesta', () => {
  it('se crea pendiente, sin votos y con precio opcional no negativo', () => {
    expect(nueva().aDatos()).toMatchObject({ estado: 'PENDIENTE', votos: [], precio: null });
    expect(() =>
      Propuesta.proponer({ ...nueva().aDatos(), coordenadas: null, precio: -1, ahora: AHORA }),
    ).toThrow(expect.objectContaining({ codigo: 'PRECIO_INVALIDO' }));
  });

  describe('RN-R1: matriz de transiciones', () => {
    const esperado: Record<
      EstadoPropuesta,
      Partial<Record<AccionSobrePropuesta, EstadoPropuesta>>
    > = {
      PENDIENTE: { confirmar: 'CONFIRMADA', denegar: 'DENEGADA' },
      CONFIRMADA: { cancelar: 'CANCELADA' },
      DENEGADA: {},
      CANCELADA: {},
    };
    for (const estado of Object.keys(esperado) as EstadoPropuesta[]) {
      for (const accion of ['confirmar', 'denegar', 'cancelar'] as const) {
        const destino = esperado[estado][accion];
        it(`${estado} + ${accion} → ${destino ?? 'TRANSICION_INVALIDA'}`, () => {
          const p = enEstado(estado);
          if (destino) {
            p.resolver(accion, 'ana', AHORA);
            expect(p.aDatos()).toMatchObject({
              estado: destino,
              resueltaPorId: 'ana',
              resueltaEn: AHORA,
            });
          } else {
            expect(() => p.resolver(accion, 'ana', AHORA)).toThrow(
              expect.objectContaining({ codigo: 'TRANSICION_INVALIDA' }),
            );
          }
        });
      }
    }
  });

  describe('RN-X3: votos', () => {
    it('un voto por viajero; votar de nuevo reemplaza el valor; quien propone puede votar', () => {
      const p = nueva();
      p.votar('ana', 'A_FAVOR', AHORA);
      p.votar('tomas', 'A_FAVOR', AHORA);
      p.votar('tomas', 'EN_CONTRA', AHORA);
      expect(p.conteo()).toEqual({ aFavor: 1, enContra: 1 });
    });

    it('P6: desvotar retira el voto propio y avisa si no había votado', () => {
      const p = nueva();
      p.votar('tomas', 'A_FAVOR', AHORA);
      p.desvotar('tomas');
      expect(p.conteo()).toEqual({ aFavor: 0, enContra: 0 });
      expect(() => p.desvotar('tomas')).toThrow(expect.objectContaining({ codigo: 'SIN_VOTO' }));
    });

    it('no se vota ni se desvota una propuesta resuelta', () => {
      for (const estado of ['CONFIRMADA', 'DENEGADA', 'CANCELADA'] as const) {
        const p = enEstado(estado);
        expect(() => p.votar('tomas', 'A_FAVOR', AHORA)).toThrow(
          expect.objectContaining({ codigo: 'PROPUESTA_NO_PENDIENTE' }),
        );
        expect(() => p.desvotar('tomas')).toThrow(
          expect.objectContaining({ codigo: 'PROPUESTA_NO_PENDIENTE' }),
        );
      }
    });
  });
});

describe('Coordenadas', () => {
  it('exige ambas o ninguna, dentro de rango', () => {
    expect(Coordenadas.opcionales(undefined, undefined)).toBeNull();
    expect(Coordenadas.opcionales(-41.1, -71.3)).toMatchObject({ latitud: -41.1, longitud: -71.3 });
    expect(() => Coordenadas.opcionales(-41.1, undefined)).toThrow(
      expect.objectContaining({ codigo: 'COORDENADAS_INVALIDAS' }),
    );
    expect(() => Coordenadas.crear(91, 0)).toThrow(
      expect.objectContaining({ codigo: 'COORDENADAS_INVALIDAS' }),
    );
  });
});
