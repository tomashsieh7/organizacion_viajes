import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConsultarAlojamientos,
  ProponerAlojamiento,
} from '../../src/modulos/alojamientos/casos-de-uso/casosDeUsoAlojamientos.js';
import type { ReposAlojamientos } from '../../src/modulos/alojamientos/dominio/puertos.js';
import {
  ResolverPropuesta,
  Votar,
} from '../../src/modulos/propuestas/casos-de-uso/casosDeUsoPropuestas.js';
import type {
  ConsultaPropuestas,
  ReglaAlResolver,
  ReposPropuestas,
} from '../../src/modulos/propuestas/dominio/puertos.js';
import { UnidadDeTrabajoEnMemoria } from '../soporte/unidadDeTrabajoEnMemoria.js';
import {
  baseVacia,
  ConsultaAlojamientosEnMemoria,
  ConsultaFechasDeViajeEnMemoria,
  ConsultaPropuestasEnMemoria,
  RepositorioAlojamientosEnMemoria,
  RepositorioPropuestasEnMemoria,
  type BaseEnMemoria,
} from '../soporte/memoria.js';

const reloj = { ahora: () => new Date('2026-09-24T12:00:00Z') };
let base: BaseEnMemoria;
let unidadAlojamientos: UnidadDeTrabajoEnMemoria<BaseEnMemoria, ReposAlojamientos>;
let unidadPropuestas: UnidadDeTrabajoEnMemoria<BaseEnMemoria, ReposPropuestas>;
const VIAJE = 'v1';

beforeEach(() => {
  base = baseVacia();
  base.usuarios.push(
    { id: 'ana', nombre: 'Ana', apodo: null },
    { id: 'tomas', nombre: 'Tomás', apodo: null },
  );
  base.viajes.push({
    id: VIAJE,
    nombre: 'Bariloche',
    destino: 'Bariloche',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-16',
    monedaCodigo: 'ARS',
    creadoPorId: 'ana',
    creadoEn: new Date(),
    membresias: [],
  });
  unidadAlojamientos = new UnidadDeTrabajoEnMemoria(base, (e) => ({
    alojamientos: new RepositorioAlojamientosEnMemoria(e),
  }));
});

/** La unidad de propuestas parte del estado que dejó la de alojamientos. */
function unidadDePropuestasSobre(estado: BaseEnMemoria) {
  unidadPropuestas = new UnidadDeTrabajoEnMemoria(estado, (e) => ({
    propuestas: new RepositorioPropuestasEnMemoria(e),
  }));
  return unidadPropuestas;
}

const proponer = (fechaDesde = '2026-12-10', fechaHasta = '2026-12-13') =>
  new ProponerAlojamiento(
    unidadAlojamientos,
    new ConsultaFechasDeViajeEnMemoria(base),
    reloj,
  ).ejecutar(VIAJE, 'tomas', {
    nombre: 'Hostel Patagonia',
    descripcion: 'Con desayuno',
    ubicacion: 'Centro',
    latitud: -41.13,
    longitud: -71.31,
    fechaDesde,
    fechaHasta,
    precio: 100_000,
  });

describe('CU05: proponer alojamiento', () => {
  it('se guarda pendiente con sus datos', async () => {
    const id = await proponer();
    const lista = await new ConsultarAlojamientos(
      new ConsultaAlojamientosEnMemoria(unidadAlojamientos.confirmado),
    ).listar(VIAJE, 'tomas');
    expect(lista).toEqual([
      expect.objectContaining({
        id,
        estado: 'PENDIENTE',
        precio: 100_000,
        latitud: -41.13,
        autor: { usuarioId: 'tomas', nombre: 'Tomás' },
        alojamiento: {
          nombre: 'Hostel Patagonia',
          fechaDesde: '2026-12-10',
          fechaHasta: '2026-12-13',
        },
      }),
    ]);
  });

  it('RN-X4: la entrada y la salida tienen que caer dentro del viaje', async () => {
    await expect(proponer('2026-12-09', '2026-12-12')).rejects.toMatchObject({
      codigo: 'FUERA_DEL_VIAJE',
    });
    await expect(proponer('2026-12-15', '2026-12-17')).rejects.toMatchObject({
      codigo: 'FUERA_DEL_VIAJE',
    });
    await expect(proponer('2026-12-10', '2026-12-16')).resolves.toBeTypeOf('string');
  });
});

describe('Votar y resolver', () => {
  let id: string;
  beforeEach(async () => {
    id = await proponer();
    unidadDePropuestasSobre(unidadAlojamientos.confirmado);
  });
  const consultas = () => new ConsultaPropuestasEnMemoria(unidadPropuestas.confirmado);

  it('CU06 y CU25: vota, reemplaza el voto y desvota; responde con la vista actualizada', async () => {
    const votar = new Votar(
      unidadPropuestas,
      { obtenerVista: (...a) => consultas().obtenerVista(...a) },
      reloj,
    );
    expect(await votar.votar(VIAJE, id, 'ana', 'A_FAVOR')).toMatchObject({
      votosAFavor: 1,
      miVoto: 'A_FAVOR',
    });
    expect(await votar.votar(VIAJE, id, 'ana', 'EN_CONTRA')).toMatchObject({
      votosAFavor: 0,
      votosEnContra: 1,
    });
    expect(await votar.desvotar(VIAJE, id, 'ana')).toMatchObject({
      votosEnContra: 0,
      miVoto: null,
    });
    await expect(votar.votar('otro-viaje', id, 'ana', 'A_FAVOR')).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });

  it('CU07: confirma y ejecuta las reglas inyectadas dentro de la transacción', async () => {
    const vistas: string[] = [];
    const regla: ReglaAlResolver<ReposPropuestas> = {
      async alResolver({ propuesta, accion }) {
        vistas.push(`${accion}:${propuesta.estado}`);
        return ['otra-propuesta'];
      },
    };
    const resolver = new ResolverPropuesta(
      unidadPropuestas,
      { obtenerVista: (...a) => consultas().obtenerVista(...a) },
      reloj,
      [regla],
    );
    const r = await resolver.ejecutar(VIAJE, id, 'confirmar', 'ana');
    expect(r.propuesta.estado).toBe('CONFIRMADA');
    expect(r.afectadas).toEqual(['otra-propuesta']);
    expect(vistas).toEqual(['confirmar:CONFIRMADA']);
  });

  it('RN-R2: el Admin confirma o deniega libremente, sin umbral de votos', async () => {
    const otra = await proponer('2026-12-13', '2026-12-16');
    unidadDePropuestasSobre(unidadAlojamientos.confirmado);
    const lector: ConsultaPropuestas = {
      obtenerVista: (...a) => consultas().obtenerVista(...a),
    };
    const votar = new Votar(unidadPropuestas, lector, reloj);
    const resolver = new ResolverPropuesta(unidadPropuestas, lector, reloj);
    // Confirma una propuesta con más votos en contra que a favor.
    await votar.votar(VIAJE, id, 'ana', 'EN_CONTRA');
    await votar.votar(VIAJE, id, 'tomas', 'EN_CONTRA');
    expect((await resolver.ejecutar(VIAJE, id, 'confirmar', 'ana')).propuesta).toMatchObject({
      estado: 'CONFIRMADA',
      votosEnContra: 2,
    });
    // Y deniega otra que solo tiene votos a favor.
    await votar.votar(VIAJE, otra, 'tomas', 'A_FAVOR');
    expect((await resolver.ejecutar(VIAJE, otra, 'denegar', 'ana')).propuesta.estado).toBe(
      'DENEGADA',
    );
  });

  it('si una regla rechaza la resolución, no se guarda nada', async () => {
    const regla: ReglaAlResolver<ReposPropuestas> = {
      async alResolver() {
        throw new Error('rechazada por la regla');
      },
    };
    const resolver = new ResolverPropuesta(
      unidadPropuestas,
      { obtenerVista: (...a) => consultas().obtenerVista(...a) },
      reloj,
      [regla],
    );
    await expect(resolver.ejecutar(VIAJE, id, 'confirmar', 'ana')).rejects.toThrow(
      'rechazada por la regla',
    );
    expect(unidadPropuestas.confirmado.propuestas[0]?.datos.estado).toBe('PENDIENTE');
  });
});
