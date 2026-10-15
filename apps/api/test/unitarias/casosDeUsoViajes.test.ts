import { beforeEach, describe, expect, it } from 'vitest';
import { BusDeEventosEnMemoria, type EventoDeDominio } from '../../src/compartido/eventos.js';
import {
  AgregarViajero,
  ConsultarViajes,
  CrearViaje,
  EliminarParticipante,
  SalirDelViaje,
  TransferirAdministracion,
  type DependenciasViajes,
} from '../../src/modulos/viajes/casos-de-uso/casosDeUsoViajes.js';
import type {
  ConsultaViajes,
  NovedadesDelViaje,
  ReposViajes,
  ResumenSinNovedades,
} from '../../src/modulos/viajes/dominio/puertos.js';
import { UnidadDeTrabajoEnMemoria } from '../soporte/unidadDeTrabajoEnMemoria.js';
import {
  baseVacia,
  BuscadorDeUsuariosEnMemoria,
  ConsultaDeudasEnMemoria,
  ConsultaViajesEnMemoria,
  propuestaDePrueba,
  reposViajesEnMemoria,
  type BaseEnMemoria,
} from '../soporte/memoria.js';

let unidad: UnidadDeTrabajoEnMemoria<BaseEnMemoria, ReposViajes>;
let publicados: EventoDeDominio[];
let deps: DependenciasViajes;
let ana: string;
let tomas: string;
let viajeId: string;

/** Los casos de uso leen el estado confirmado de la unidad de trabajo, como leerían la base. */
const consultas = () => new ConsultaViajesEnMemoria(unidad.confirmado);

beforeEach(async () => {
  const base = baseVacia();
  ana = crypto.randomUUID();
  tomas = crypto.randomUUID();
  base.usuarios.push(
    { id: ana, nombre: 'Ana', apodo: null },
    { id: tomas, nombre: 'Tomás', apodo: null },
  );
  base.credenciales.push({
    usuarioId: tomas,
    tipo: 'EMAIL_CONTRASENA',
    identificador: 'tomas@mail.com',
    secretoHash: 'h',
  });
  unidad = new UnidadDeTrabajoEnMemoria(base, reposViajesEnMemoria);
  publicados = [];
  const bus = new BusDeEventosEnMemoria();
  bus.suscribir('viaje.miembro-dado-de-baja', (e) => void publicados.push(e));
  bus.suscribir('viaje.administracion-transferida', (e) => void publicados.push(e));
  deps = { unidad, eventos: bus, reloj: { ahora: () => new Date('2026-09-24T12:00:00Z') } };
  viajeId = await new CrearViaje(deps, new ConsultaViajesEnMemoria(base)).ejecutar(ana, {
    nombre: 'Bariloche',
    destino: 'Bariloche',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-16',
    monedaCodigo: 'ARS',
  });
});

const agregarATomas = () =>
  new AgregarViajero(deps, new BuscadorDeUsuariosEnMemoria(unidad.confirmado)).ejecutar(
    viajeId,
    ana,
    'TOMAS@mail.com',
  );

describe('Casos de uso de viajes', () => {
  it('CU01: crea el viaje con quien lo crea como Admin; rechaza monedas inexistentes', async () => {
    expect(await consultas().obtenerAcceso(viajeId, ana)).toEqual({ rol: 'ADMIN' });
    await expect(
      new CrearViaje(deps, consultas()).ejecutar(ana, {
        nombre: 'x',
        destino: 'y',
        fechaInicio: '2026-12-10',
        fechaFin: '2026-12-11',
        monedaCodigo: 'XXX',
      }),
    ).rejects.toMatchObject({ codigo: 'MONEDA_INEXISTENTE' });
  });

  it('CU02: agrega por email de un usuario registrado y avisa si no existe', async () => {
    expect(await agregarATomas()).toBe(tomas);
    expect(await consultas().obtenerAcceso(viajeId, tomas)).toEqual({ rol: 'VIAJERO' });
    await expect(
      new AgregarViajero(deps, new BuscadorDeUsuariosEnMemoria(unidad.confirmado)).ejecutar(
        viajeId,
        ana,
        'nadie@mail.com',
      ),
    ).rejects.toMatchObject({ codigo: 'USUARIO_NO_REGISTRADO' });
  });

  it('CU03: elimina con deuda, retira sus votos pendientes y publica el evento al confirmar', async () => {
    await agregarATomas();
    unidad.prepararEstado((estado) => {
      estado.deudas.push({ viajeId, deudorId: tomas, acreedorId: ana, monto: 500 });
      estado.propuestas.push(
        propuestaDePrueba({ id: 'p1', viajeId, autorId: ana, votantes: [tomas] }),
        propuestaDePrueba({
          id: 'p2',
          viajeId,
          autorId: ana,
          estado: 'CONFIRMADA',
          votantes: [tomas],
        }),
      );
    });
    const conDeuda = await new EliminarParticipante(deps).ejecutar(viajeId, ana, tomas);
    expect(conDeuda).toBe(true);
    const votosDeTomas = unidad.confirmado.propuestas.filter((p) =>
      p.datos.votos.some((v) => v.usuarioId === tomas),
    );
    expect(votosDeTomas.map((p) => p.datos.id)).toEqual(['p2']);
    expect(await consultas().obtenerAcceso(viajeId, tomas)).toBeNull();
    expect(publicados).toEqual([
      expect.objectContaining({
        tipo: 'viaje.miembro-dado-de-baja',
        usuarioId: tomas,
        bajaConDeuda: true,
      }),
    ]);
  });

  it('no publica eventos ni guarda cambios si la operación falla', async () => {
    await agregarATomas();
    await expect(
      new EliminarParticipante(deps).ejecutar(viajeId, tomas, ana),
    ).rejects.toMatchObject({ codigo: 'SOLO_ADMIN' });
    expect(publicados).toEqual([]);
    expect(await consultas().obtenerAcceso(viajeId, ana)).toEqual({ rol: 'ADMIN' });
  });

  it('CU04 y CU24: el Admin sale eligiendo sucesor; se publican traspaso y baja', async () => {
    await agregarATomas();
    expect(await new SalirDelViaje(deps).ejecutar(viajeId, ana, tomas)).toBe(false);
    expect(await consultas().obtenerAcceso(viajeId, tomas)).toEqual({ rol: 'ADMIN' });
    expect(await consultas().obtenerAcceso(viajeId, ana)).toBeNull();
    expect(publicados.map((e) => e.tipo)).toEqual([
      'viaje.administracion-transferida',
      'viaje.miembro-dado-de-baja',
    ]);
  });

  it('CU24: transfiere la administración sin salir', async () => {
    await agregarATomas();
    await new TransferirAdministracion(deps).ejecutar(viajeId, ana, tomas);
    expect(await consultas().obtenerAcceso(viajeId, ana)).toEqual({ rol: 'VIAJERO' });
  });

  it('el detalle informa la deuda pendiente de quien consulta', async () => {
    const base = unidad.confirmado;
    base.deudas.push({ viajeId, deudorId: ana, acreedorId: tomas, monto: 1234 });
    const detalle = await new ConsultarViajes(
      new ConsultaViajesEnMemoria(base),
      new ConsultaDeudasEnMemoria(base),
      { deViajes: async () => new Map() },
    ).detalle(viajeId, ana);
    expect(detalle).toMatchObject({
      miDeudaPendiente: 1234,
      miRol: 'ADMIN',
      cantidadParticipantes: 1,
    });
  });

  it('responde NO_ENCONTRADO si el viaje no existe', async () => {
    await expect(
      new TransferirAdministracion(deps).ejecutar(crypto.randomUUID(), ana, tomas),
    ).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });
});

describe('ConsultarViajes: lista de grupos', () => {
  const resumen = (id: string, miAcceso: 'COMPLETO' | 'SOLO_SALDOS' = 'COMPLETO') =>
    ({
      id,
      nombre: id,
      destino: 'Bariloche',
      fechaInicio: '2026-12-10',
      fechaFin: '2026-12-16',
      monedaCodigo: 'ARS',
      miRol: 'VIAJERO',
      miAcceso,
    }) satisfies ResumenSinNovedades;
  const novedad = (en: string, mensajesSinLeer = 0): NovedadesDelViaje => ({
    mensajesSinLeer,
    ultimaNovedad: {
      tipo: 'MENSAJE',
      autor: null,
      texto: 'hola',
      monto: null,
      contraparte: null,
      en,
    },
  });

  it('ordena por la novedad más reciente y deja al final los viajes sin novedades', async () => {
    // La consulta los devuelve por fecha de inicio: a, b, c y d.
    const viajes = [resumen('a'), resumen('b'), resumen('c'), resumen('d', 'SOLO_SALDOS')];
    const pedidos: string[][] = [];
    const lista = await new ConsultarViajes(
      { listarDeUsuario: async () => viajes } as unknown as ConsultaViajes,
      new ConsultaDeudasEnMemoria(baseVacia()),
      {
        deViajes: async (_usuarioId, ids) => {
          pedidos.push(ids);
          return new Map([
            ['b', novedad('2026-10-01T10:00:00.000Z', 2)],
            ['c', novedad('2026-10-02T10:00:00.000Z')],
          ]);
        },
      },
    ).listarMisViajes(ana);

    expect(lista.map((v) => v.id)).toEqual(['c', 'b', 'a', 'd']);
    expect(lista[1]).toMatchObject({ mensajesSinLeer: 2 });
    // Con acceso solo a saldos no se piden novedades: no ve el chat ni el resto del viaje.
    expect(pedidos).toEqual([['a', 'b', 'c']]);
    expect(lista[3]).toMatchObject({ mensajesSinLeer: 0, ultimaNovedad: null });
  });
});
