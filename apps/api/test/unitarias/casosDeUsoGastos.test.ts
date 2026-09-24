import { beforeEach, describe, expect, it } from 'vitest';
import type { DatosGastoNuevo } from '@viajes/compartido';
import {
  AnotarGasto,
  ConsultarDeudas,
  RegistrarPago,
} from '../../src/modulos/gastos/casos-de-uso/casosDeUsoGastos.js';
import {
  DivisionArbitraria,
  DivisionEnPartesIguales,
} from '../../src/modulos/gastos/dominio/division.js';
import type { ReposGastos } from '../../src/modulos/gastos/dominio/puertos.js';
import { ConsultarAcceso } from '../../src/modulos/viajes/casos-de-uso/casosDeUsoViajes.js';
import { UnidadDeTrabajoEnMemoria } from '../soporte/unidadDeTrabajoEnMemoria.js';
import {
  baseVacia,
  ConsultaCategoriasEnMemoria,
  ConsultaSaldosEnMemoria,
  ConsultaSaldosPendientesEnMemoria,
  RepositorioDeudasEnMemoria,
  RepositorioGastosEnMemoria,
  RepositorioViajesEnMemoria,
  type BaseEnMemoria,
} from '../soporte/memoria.js';

const VIAJE = 'v1';
const [ANA, TOMAS, LUIS, SOFIA] = ['ana', 'tomas', 'luis', 'sofia'];
let base: BaseEnMemoria;
let unidad: UnidadDeTrabajoEnMemoria<BaseEnMemoria, ReposGastos>;
let comida: string;

const miembro = (usuarioId: string, estado: 'ACTIVA' | 'RETIRADA' = 'ACTIVA') => ({
  usuarioId,
  rol: usuarioId === ANA ? ('ADMIN' as const) : ('VIAJERO' as const),
  estado,
  bajaConDeuda: false,
  altaEn: new Date(),
  bajaEn: estado === 'ACTIVA' ? null : new Date(),
});

beforeEach(() => {
  base = baseVacia();
  for (const id of [ANA, TOMAS, LUIS, SOFIA]) base.usuarios.push({ id, nombre: id, apodo: null });
  base.viajes.push({
    id: VIAJE,
    nombre: 'Bariloche',
    destino: 'Bariloche',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-16',
    monedaCodigo: 'ARS',
    creadoPorId: ANA,
    creadoEn: new Date(),
    membresias: [miembro(ANA), miembro(TOMAS), miembro(LUIS), miembro(SOFIA, 'RETIRADA')],
  });
  comida = base.categorias[0]!.id;
  unidad = new UnidadDeTrabajoEnMemoria(base, (e) => ({
    gastos: new RepositorioGastosEnMemoria(e),
    deudas: new RepositorioDeudasEnMemoria(e),
  }));
});

const anotar = (registradoPor: string, datos: Partial<DatosGastoNuevo>) =>
  new AnotarGasto({
    unidad,
    viajes: new RepositorioViajesEnMemoria(unidad.confirmado),
    categorias: new ConsultaCategoriasEnMemoria(base),
    division: (d) =>
      d.modoDivision === 'ARBITRARIA'
        ? new DivisionArbitraria(new Map((d.partes ?? []).map((p) => [p.usuarioId, p.monto])))
        : new DivisionEnPartesIguales(),
    reloj: { ahora: () => new Date('2026-12-11T20:00:00Z') },
  }).ejecutar(VIAJE, registradoPor, {
    titulo: 'Cena',
    categoriaId: comida,
    monto: 900,
    deudores: [ANA, TOMAS, LUIS],
    modoDivision: 'IGUALES',
    ...datos,
  });

const monto = (deudorId: string, acreedorId: string) =>
  unidad.confirmado.deudas.find(
    (d) => d.viajeId === VIAJE && d.deudorId === deudorId && d.acreedorId === acreedorId,
  )?.monto ?? 0;

describe('CU20: anotar gasto', () => {
  it('RN-G2 y RN-G6: por defecto paga quien anota y su parte no genera deuda', async () => {
    await anotar(ANA, {});
    expect(unidad.confirmado.gastos[0]).toMatchObject({ pagadoPorId: ANA, registradoPorId: ANA });
    expect([monto(TOMAS, ANA), monto(LUIS, ANA), monto(ANA, ANA)]).toEqual([300, 300, 0]);
  });

  it('P13: el pagador fuera de los elegidos, con otro pagador', async () => {
    await anotar(ANA, { pagadoPorId: TOMAS, deudores: [ANA, LUIS], monto: 1001 });
    expect([monto(ANA, TOMAS), monto(LUIS, TOMAS)]).toEqual([501, 500]);
  });

  it('P15: compensa con lo que el pagador debía y deja una sola deuda neta', async () => {
    // Ana le debe 10.000 a Tomás; Ana paga un gasto en el que la parte de Tomás es 4.000.
    base.deudas.push({ viajeId: VIAJE, deudorId: ANA, acreedorId: TOMAS, monto: 10_000 });
    await anotar(ANA, {
      monto: 4_000,
      deudores: [TOMAS],
      modoDivision: 'ARBITRARIA',
      partes: [{ usuarioId: TOMAS, monto: 4_000 }],
    });
    expect([monto(ANA, TOMAS), monto(TOMAS, ANA)]).toEqual([6_000, 0]);
  });

  it('RN-G2 y RN-G3: pagador y deudores tienen que participar del viaje', async () => {
    await expect(anotar(ANA, { pagadoPorId: SOFIA })).rejects.toMatchObject({
      codigo: 'PAGADOR_NO_PARTICIPANTE',
    });
    await expect(anotar(ANA, { deudores: [TOMAS, SOFIA, 'nadie'] })).rejects.toMatchObject({
      codigo: 'DEUDOR_NO_PARTICIPANTE',
      detalles: { usuarios: [SOFIA, 'nadie'] },
    });
    expect(unidad.confirmado.gastos).toEqual([]);
  });

  it('RN-G4: con la suma arbitraria incorrecta no guarda nada', async () => {
    await expect(
      anotar(ANA, {
        deudores: [TOMAS, LUIS],
        modoDivision: 'ARBITRARIA',
        partes: [
          { usuarioId: TOMAS, monto: 500 },
          { usuarioId: LUIS, monto: 300 },
        ],
      }),
    ).rejects.toMatchObject({ codigo: 'SUMA_NO_COINCIDE', detalles: { diferencia: 100 } });
    expect(unidad.confirmado.gastos).toEqual([]);
    expect(unidad.confirmado.deudas).toEqual([]);
  });

  it('la categoría tiene que existir', async () => {
    await expect(anotar(ANA, { categoriaId: crypto.randomUUID() })).rejects.toMatchObject({
      codigo: 'CATEGORIA_INEXISTENTE',
    });
  });
});

describe('CU21 y CU22: deudas propias', () => {
  it('lista lo que debo y lo que me deben', async () => {
    await anotar(ANA, {});
    const consultar = new ConsultarDeudas(new ConsultaSaldosEnMemoria(unidad.confirmado));
    expect((await consultar.ejecutar(VIAJE, ANA, 'acreedor')).map((d) => d.monto)).toEqual([
      300, 300,
    ]);
    expect(await consultar.ejecutar(VIAJE, ANA, 'deudor')).toEqual([]);
    expect((await consultar.ejecutar(VIAJE, TOMAS, 'deudor')).map((d) => d.contraparte.id)).toEqual(
      [ANA],
    );
  });
});

describe('CU23: registrar pago', () => {
  const pagar = (deudor: string, acreedorId: string, monto: number) =>
    new RegistrarPago({
      unidad,
      viajes: new RepositorioViajesEnMemoria(unidad.confirmado),
      saldos: {
        deudas: async () => [],
        obtenerPago: (v, id) => new ConsultaSaldosEnMemoria(unidad.confirmado).obtenerPago(v, id),
      },
      reloj: { ahora: () => new Date('2026-12-12T10:00:00Z') },
    }).ejecutar(VIAJE, deudor, { acreedorId, monto });

  it('resta el pago y devuelve el pago con el saldo que queda', async () => {
    await anotar(ANA, {});
    const r = await pagar(TOMAS, ANA, 100);
    expect(r).toMatchObject({
      saldo: 200,
      pago: { monto: 100, registradoPor: { id: TOMAS }, fecha: '2026-12-12T10:00:00.000Z' },
    });
    expect(monto(TOMAS, ANA)).toBe(200);
  });

  it('RN-P1: sin deuda pendiente con ese acreedor, SIN_DEUDA_CON_ACREEDOR', async () => {
    await expect(pagar(TOMAS, ANA, 100)).rejects.toMatchObject({
      codigo: 'SIN_DEUDA_CON_ACREEDOR',
    });
    await anotar(ANA, {});
    // El acreedor no puede "pagar" la deuda que tienen con él.
    await expect(pagar(ANA, TOMAS, 100)).rejects.toMatchObject({
      codigo: 'SIN_DEUDA_CON_ACREEDOR',
    });
    await pagar(TOMAS, ANA, 300);
    await expect(pagar(TOMAS, ANA, 1)).rejects.toMatchObject({ codigo: 'SIN_DEUDA_CON_ACREEDOR' });
  });

  it('RN-P4: si supera el saldo no registra nada', async () => {
    await anotar(ANA, {});
    await expect(pagar(TOMAS, ANA, 301)).rejects.toMatchObject({
      codigo: 'PAGO_EXCEDE_DEUDA',
      detalles: { saldo: 300 },
    });
    expect(unidad.confirmado.pagos).toEqual([]);
    expect(monto(TOMAS, ANA)).toBe(300);
  });
});

describe('RN-E6: ConsultarAcceso', () => {
  const acceso = (usuarioId: string) =>
    new ConsultarAcceso(
      new RepositorioViajesEnMemoria(base),
      new ConsultaSaldosPendientesEnMemoria(base),
    ).ejecutar(VIAJE, usuarioId);

  it('completo para participantes; solo saldos para quien se fue con saldos; si no, prohibido', async () => {
    expect(await acceso(TOMAS)).toEqual({ rol: 'VIAJERO', tipo: 'COMPLETO' });
    await expect(acceso(SOFIA)).rejects.toMatchObject({ codigo: 'NO_PARTICIPANTE' });
    base.deudas.push({ viajeId: VIAJE, deudorId: ANA, acreedorId: SOFIA, monto: 100 });
    expect(await acceso(SOFIA)).toEqual({ rol: 'VIAJERO', tipo: 'SOLO_SALDOS' });
    await expect(acceso('desconocido')).rejects.toMatchObject({ codigo: 'NO_PARTICIPANTE' });
  });
});
