import { beforeEach, describe, expect, it } from 'vitest';
import type { DatosActividadNueva } from '@viajes/compartido';
import {
  ConsultarActividades,
  ProponerActividad,
  ProponerAlternativa,
  type DependenciasProponerActividad,
} from '../../src/modulos/actividades/casos-de-uso/casosDeUsoActividades.js';
import {
  ReglaOpcionesAlConfirmar,
  ReglaSuperposicionAlConfirmar,
} from '../../src/modulos/actividades/casos-de-uso/reglasDeResolucion.js';
import type { ReposResolucionConActividades } from '../../src/modulos/actividades/dominio/puertos.js';
import {
  ResolverPropuesta,
  Votar,
} from '../../src/modulos/propuestas/casos-de-uso/casosDeUsoPropuestas.js';
import { UnidadDeTrabajoEnMemoria } from '../soporte/unidadDeTrabajoEnMemoria.js';
import {
  baseVacia,
  ConsultaActividadesEnMemoria,
  ConsultaFechasDeViajeEnMemoria,
  ConsultaPropuestasEnMemoria,
  propuestaDePrueba,
  RepositorioActividadesEnMemoria,
  RepositorioPropuestasEnMemoria,
  type BaseEnMemoria,
} from '../soporte/memoria.js';

const reloj = { ahora: () => new Date('2026-09-24T12:00:00Z') };
const VIAJE = 'v1';
let unidad: UnidadDeTrabajoEnMemoria<BaseEnMemoria, ReposResolucionConActividades>;
let deps: DependenciasProponerActividad;

beforeEach(() => {
  const base = baseVacia();
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
  unidad = new UnidadDeTrabajoEnMemoria(base, (e) => ({
    propuestas: new RepositorioPropuestasEnMemoria(e),
    actividades: new RepositorioActividadesEnMemoria(e),
  }));
  deps = {
    unidad,
    fechas: { rango: (id) => new ConsultaFechasDeViajeEnMemoria(unidad.confirmado).rango(id) },
    reloj,
  };
});

const consultas = {
  obtenerVista: (v: string, p: string, u: string) =>
    new ConsultaPropuestasEnMemoria(unidad.confirmado).obtenerVista(v, p, u),
};
const consultar = () =>
  new ConsultarActividades(new ConsultaActividadesEnMemoria(unidad.confirmado));
const estado = (id: string) =>
  unidad.confirmado.propuestas.find((p) => p.datos.id === id)?.datos.estado;

const datos = (
  titulo: string,
  horaInicio = '10:00',
  duracionMin = 120,
  fecha = '2026-12-11',
): DatosActividadNueva => ({
  titulo,
  descripcion: 'x',
  ubicacion: 'Lago',
  latitud: -41.1,
  longitud: -71.4,
  fecha,
  horaInicio,
  duracionMin,
});

const proponer = (d: DatosActividadNueva, autor = 'tomas') =>
  new ProponerActividad(deps).ejecutar(VIAJE, autor, d);
const alternativa = (original: string, d: DatosActividadNueva) =>
  new ProponerAlternativa(deps).ejecutar(VIAJE, original, 'tomas', d);
const resolver = new ResolverPropuesta<ReposResolucionConActividades>(
  { ejecutar: (t) => unidad.ejecutar(t) },
  consultas,
  reloj,
  [new ReglaSuperposicionAlConfirmar(), new ReglaOpcionesAlConfirmar()],
);
const resolverComo = (id: string, accion: 'confirmar' | 'denegar' | 'cancelar') =>
  resolver.ejecutar(VIAJE, id, accion, 'ana');

describe('CU10: proponer actividad', () => {
  it('RN-A3: se guarda pendiente con su horario y se lista con la hora de fin', async () => {
    const id = await proponer(datos('Kayak', '23:00', 120));
    expect(await consultar().obtener(VIAJE, id, 'ana')).toMatchObject({
      id,
      estado: 'PENDIENTE',
      autor: { usuarioId: 'tomas', nombre: 'Tomás' },
      actividad: { titulo: 'Kayak', horaInicio: '23:00', horaFin: '01:00', alternativaDe: null },
    });
  });

  it('RN-X4: el día de inicio tiene que caer dentro del viaje', async () => {
    await expect(proponer(datos('Kayak', '10:00', 60, '2026-12-09'))).rejects.toMatchObject({
      codigo: 'FUERA_DEL_VIAJE',
      detalles: { desde: '2026-12-10', hasta: '2026-12-16' },
    });
    // Termina al día siguiente del fin del viaje, pero empieza dentro: se acepta.
    await expect(proponer(datos('Salida', '23:00', 180, '2026-12-16'))).resolves.toBeTypeOf(
      'string',
    );
    await expect(
      new ProponerActividad(deps).ejecutar('otro', 'ana', datos('Kayak')),
    ).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });

  it('RN-A2: rechaza la que choca con una confirmada, con el detalle del conflicto', async () => {
    const kayak = await proponer(datos('Kayak'));
    await resolverComo(kayak, 'confirmar');
    await expect(proponer(datos('Trekking', '11:00', 60))).rejects.toMatchObject({
      categoria: 'CONFLICTO',
      codigo: 'SUPERPOSICION_HORARIA',
      detalles: {
        conflictos: [
          {
            id: kayak,
            titulo: 'Kayak',
            fecha: '2026-12-11',
            horaInicio: '10:00',
            duracionMin: 120,
          },
        ],
      },
    });
    expect(unidad.confirmado.propuestas).toHaveLength(1);
    await expect(proponer(datos('Almuerzo', '12:00', 60))).resolves.toBeTypeOf('string');
  });

  it('RN-A2: solo cuentan las confirmadas; se puede superponer con una pendiente', async () => {
    await proponer(datos('Kayak'));
    await expect(proponer(datos('Trekking'))).resolves.toBeTypeOf('string');
  });
});

describe('CU11: proponer alternativa', () => {
  it('queda vinculada a la original y la de una alternativa también', async () => {
    const kayak = await proponer(datos('Kayak'));
    const trekking = await alternativa(kayak, datos('Trekking'));
    const bici = await alternativa(trekking, datos('Bici'));
    const lista = await consultar().listar(VIAJE, 'ana');
    expect(lista.map((a) => [a.actividad.titulo, a.actividad.alternativaDe?.id ?? null])).toEqual([
      ['Kayak', null],
      ['Trekking', kayak],
      ['Bici', kayak],
    ]);
    expect(lista.find((a) => a.id === bici)?.actividad.alternativaDe).toEqual({
      id: kayak,
      titulo: 'Kayak',
    });
  });

  it('solo sobre actividades pendientes y existentes', async () => {
    const kayak = await proponer(datos('Kayak'));
    await resolverComo(kayak, 'denegar');
    await expect(alternativa(kayak, datos('Trekking'))).rejects.toMatchObject({
      codigo: 'ORIGINAL_NO_PENDIENTE',
    });
    await expect(alternativa(crypto.randomUUID(), datos('Trekking'))).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });

  it('una propuesta que no es actividad no admite alternativas', async () => {
    const alojamiento = propuestaDePrueba({ viajeId: VIAJE, autorId: 'ana' });
    unidad.prepararEstado((e) => e.propuestas.push(alojamiento));
    await expect(alternativa(alojamiento.datos.id, datos('Trekking'))).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });

  it('RN-B2: pasa por el mismo control de fechas y de superposición', async () => {
    const cena = await proponer(datos('Cena', '21:00', 90));
    await resolverComo(cena, 'confirmar');
    const kayak = await proponer(datos('Kayak'));
    await expect(alternativa(kayak, datos('Bar', '20:00', 120))).rejects.toMatchObject({
      codigo: 'SUPERPOSICION_HORARIA',
    });
    await expect(alternativa(kayak, datos('Bar', '20:00', 60, '2026-12-17'))).rejects.toMatchObject(
      {
        codigo: 'FUERA_DEL_VIAJE',
      },
    );
  });
});

describe('CU13 a CU15: resolver actividades (RN-R3 y RN-R4)', () => {
  it('confirmar una opción deniega las demás pendientes del grupo y las informa', async () => {
    const kayak = await proponer(datos('Kayak'));
    const trekking = await alternativa(kayak, datos('Trekking'));
    const bici = await alternativa(kayak, datos('Bici'));
    const suelta = await proponer(datos('Cena', '21:00', 90));

    const r = await resolverComo(trekking, 'confirmar');
    expect(r.propuesta.estado).toBe('CONFIRMADA');
    expect(r.afectadas.sort()).toEqual([kayak, bici].sort());
    expect([estado(kayak), estado(trekking), estado(bici), estado(suelta)]).toEqual([
      'DENEGADA',
      'CONFIRMADA',
      'DENEGADA',
      'PENDIENTE',
    ]);
    expect(
      unidad.confirmado.propuestas.find((p) => p.datos.id === kayak)?.datos.resueltaPorId,
    ).toBe('ana');
  });

  it('denegar la original no afecta a sus alternativas', async () => {
    const kayak = await proponer(datos('Kayak'));
    const trekking = await alternativa(kayak, datos('Trekking'));
    const r = await resolverComo(kayak, 'denegar');
    expect(r.afectadas).toEqual([]);
    expect(estado(trekking)).toBe('PENDIENTE');
    // La alternativa sigue pudiendo confirmarse, aunque la original ya esté resuelta.
    expect((await resolverComo(trekking, 'confirmar')).afectadas).toEqual([]);
  });

  it('RN-R3: no confirma una actividad que choca con otra confirmada y no cambia nada', async () => {
    const kayak = await proponer(datos('Kayak'));
    const trekking = await proponer(datos('Trekking', '11:00', 60));
    const alternativaDelTrekking = await alternativa(trekking, datos('Bici', '15:00', 60));
    await resolverComo(kayak, 'confirmar');
    await expect(resolverComo(trekking, 'confirmar')).rejects.toMatchObject({
      codigo: 'SUPERPOSICION_HORARIA',
      detalles: { conflictos: [expect.objectContaining({ id: kayak })] },
    });
    expect([estado(trekking), estado(alternativaDelTrekking)]).toEqual(['PENDIENTE', 'PENDIENTE']);
    // Cancelada la que ocupaba el horario, se puede confirmar.
    await resolverComo(kayak, 'cancelar');
    await expect(resolverComo(trekking, 'confirmar')).resolves.toMatchObject({
      propuesta: { estado: 'CONFIRMADA' },
    });
  });

  it('cancelar o resolver propuestas que no son actividades no ejecuta estas reglas', async () => {
    const kayak = await proponer(datos('Kayak'));
    const trekking = await alternativa(kayak, datos('Trekking'));
    await resolverComo(kayak, 'confirmar');
    expect(estado(trekking)).toBe('DENEGADA');
    expect((await resolverComo(kayak, 'cancelar')).afectadas).toEqual([]);
    const alojamiento = propuestaDePrueba({ viajeId: VIAJE, autorId: 'ana' });
    unidad.prepararEstado((e) => e.propuestas.push(alojamiento));
    expect((await resolverComo(alojamiento.datos.id, 'confirmar')).afectadas).toEqual([]);
  });

  it('CU25 y CU26: se vota y se desvota una actividad como cualquier propuesta', async () => {
    const kayak = await proponer(datos('Kayak'));
    const votar = new Votar<ReposResolucionConActividades>(
      { ejecutar: (t) => unidad.ejecutar(t) },
      consultas,
      reloj,
    );
    expect(await votar.votar(VIAJE, kayak, 'ana', 'A_FAVOR')).toMatchObject({
      votosAFavor: 1,
      miVoto: 'A_FAVOR',
    });
    expect(await votar.desvotar(VIAJE, kayak, 'ana')).toMatchObject({
      votosAFavor: 0,
      miVoto: null,
    });
    expect((await consultar().obtener(VIAJE, kayak, 'ana')).votosAFavor).toBe(0);
  });
});

describe('Consultar actividades', () => {
  it('filtra por estado y responde NO_ENCONTRADO si no existe', async () => {
    const kayak = await proponer(datos('Kayak'));
    await proponer(datos('Cena', '21:00', 90));
    await resolverComo(kayak, 'confirmar');
    expect((await consultar().listar(VIAJE, 'ana', 'CONFIRMADA')).map((a) => a.id)).toEqual([
      kayak,
    ]);
    await expect(consultar().obtener(VIAJE, crypto.randomUUID(), 'ana')).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });
});
