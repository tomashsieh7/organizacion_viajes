import { beforeEach, describe, expect, it } from 'vitest';
import { BusDeEventosEnMemoria, type EventoDeDominio } from '../../src/comun/eventos.js';
import { AgregarViajero } from '../../src/modulos/viajes/casos-de-uso/agregarViajero.js';
import { ConsultarViajes } from '../../src/modulos/viajes/casos-de-uso/consultarViajes.js';
import { CrearViaje } from '../../src/modulos/viajes/casos-de-uso/crearViaje.js';
import { EliminarParticipante } from '../../src/modulos/viajes/casos-de-uso/eliminarParticipante.js';
import { SalirDelViaje } from '../../src/modulos/viajes/casos-de-uso/salirDelViaje.js';
import { TransferirAdministracion } from '../../src/modulos/viajes/casos-de-uso/transferirAdministracion.js';
import { UbicarPropuesta } from '../../src/modulos/viajes/casos-de-uso/ubicarPropuesta.js';
import type { DependenciasViajes } from '../../src/modulos/viajes/casos-de-uso/dependencias.js';
import type { ReposViajes } from '../../src/modulos/viajes/dominio/puertos.js';
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
  it('CU28 y RN-V7: reubica en memoria sin perder votos ni noches; los errores revierten la transacción', async () => {
    const id = crypto.randomUUID();
    unidad.prepararEstado((base) =>
      base.propuestas.push({
        ...propuestaDePrueba({ id, viajeId, autorId: ana, estado: 'CONFIRMADA', votantes: [ana] }),
        alojamiento: { nombre: 'Hostel', fechaDesde: null, fechaHasta: null, noches: 3 },
      }),
    );
    const votos = unidad.confirmado.propuestas[0]!.datos.votos;
    const ubicar = new UbicarPropuesta(deps);
    await expect(
      ubicar.ejecutar(viajeId, tomas, id, 'ALOJAMIENTO', '2026-12-10'),
    ).rejects.toMatchObject({ codigo: 'SOLO_ADMIN' });
    await expect(
      ubicar.ejecutar(viajeId, ana, id, 'ALOJAMIENTO', '2026-12-15'),
    ).rejects.toMatchObject({ codigo: 'FUERA_DEL_VIAJE' });
    expect(unidad.confirmado.propuestas[0]!.alojamiento!.fechaDesde).toBeNull();
    await ubicar.ejecutar(viajeId, ana, id, 'ALOJAMIENTO', '2026-12-11');
    expect(unidad.confirmado.propuestas[0]).toMatchObject({
      datos: { estado: 'CONFIRMADA', votos },
      alojamiento: { fechaDesde: '2026-12-11', fechaHasta: '2026-12-14', noches: 3 },
    });
    await ubicar.ejecutar(viajeId, ana, id, 'ALOJAMIENTO', '2026-12-11');
    expect(unidad.confirmado.propuestas[0]!.alojamiento!.fechaCambiadaEn).toEqual(
      deps.reloj.ahora(),
    );
  });
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
