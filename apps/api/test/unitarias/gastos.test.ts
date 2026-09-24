import { describe, expect, it } from 'vitest';
import { Dinero } from '../../src/compartido/valores/dinero.js';
import { Deuda } from '../../src/modulos/gastos/dominio/deuda.js';
import {
  DivisionArbitraria,
  DivisionEnPartesIguales,
} from '../../src/modulos/gastos/dominio/division.js';
import { Gasto } from '../../src/modulos/gastos/dominio/gasto.js';
import { tipoDeAcceso } from '../../src/modulos/viajes/dominio/viaje.js';

const AHORA = new Date('2026-12-11T20:00:00Z');
const ars = (m: number) => Dinero.de(m, 'ARS');
const deuda = (deudorId: string, acreedorId: string, monto: number) =>
  Deuda.reconstruir({
    id: `${deudorId}-${acreedorId}`,
    viajeId: 'v1',
    deudorId,
    acreedorId,
    monto: ars(monto),
    ultimaActualizacion: new Date(0),
  });

function gasto(
  monto: number,
  deudores: string[],
  division = new DivisionEnPartesIguales() as DivisionEnPartesIguales | DivisionArbitraria,
  pagadoPorId = 'ana',
) {
  return Gasto.anotar({
    id: 'g1',
    viajeId: 'v1',
    titulo: 'Cena',
    categoriaId: 'c1',
    monto: ars(monto),
    pagadoPorId,
    registradoPorId: 'ana',
    deudores,
    division,
    ahora: AHORA,
  });
}

describe('RN-G4: divisiones', () => {
  it('partes iguales con resto: 1000 entre 3 da 334, 333 y 333', () => {
    const partes = new DivisionEnPartesIguales().dividir(ars(1000), ['a', 'b', 'c']);
    expect(partes.map((p) => [p.usuarioId, p.monto.monto])).toEqual([
      ['a', 334],
      ['b', 333],
      ['c', 333],
    ]);
  });

  it('arbitraria: la suma tiene que coincidir con el total, con el detalle de la diferencia', () => {
    const division = new DivisionArbitraria(
      new Map([
        ['a', 600],
        ['b', 300],
      ]),
    );
    expect(division.dividir(ars(900), ['a', 'b']).map((p) => p.monto.monto)).toEqual([600, 300]);
    expect(() => division.dividir(ars(1000), ['a', 'b'])).toThrow(
      expect.objectContaining({
        codigo: 'SUMA_NO_COINCIDE',
        detalles: { total: 1000, suma: 900, diferencia: 100 },
      }),
    );
  });

  it('arbitraria: un monto por cada elegido y solo para ellos', () => {
    const division = new DivisionArbitraria(new Map([['a', 900]]));
    expect(() => division.dividir(ars(900), ['a', 'b'])).toThrow(
      expect.objectContaining({ codigo: 'PARTES_NO_COINCIDEN' }),
    );
    expect(() => division.dividir(ars(900), ['b'])).toThrow(
      expect.objectContaining({ codigo: 'PARTES_NO_COINCIDEN' }),
    );
  });
});

describe('Gasto', () => {
  it('RN-G1 y RN-G3: monto positivo y al menos un deudor sin repetir', () => {
    expect(() => gasto(0, ['a'])).toThrow(expect.objectContaining({ codigo: 'MONTO_INVALIDO' }));
    expect(() => gasto(100, [])).toThrow(expect.objectContaining({ codigo: 'DEUDORES_INVALIDOS' }));
    expect(() => gasto(100, ['a', 'a'])).toThrow(
      expect.objectContaining({ codigo: 'DEUDORES_INVALIDOS' }),
    );
  });

  it('RN-G5: guarda las partes y el modo de la estrategia', () => {
    const g = gasto(1000, ['ana', 'tomas', 'luis']);
    expect(g.aDatos()).toMatchObject({ modoDivision: 'IGUALES', pagadoPorId: 'ana' });
    expect(g.aDatos().partes.map((p) => p.monto.monto)).toEqual([334, 333, 333]);
  });

  it('RN-G6: la parte del pagador no genera deuda', () => {
    const g = gasto(900, ['ana', 'tomas', 'luis']);
    expect(g.deudasGeneradas().map((d) => [d.deudorId, d.acreedorId, d.monto.monto])).toEqual([
      ['tomas', 'ana', 300],
      ['luis', 'ana', 300],
    ]);
  });

  it('P13: el pagador puede quedar fuera de los elegidos', () => {
    const g = gasto(900, ['tomas', 'luis']);
    expect(g.deudasGeneradas().map((d) => d.monto.monto)).toEqual([450, 450]);
  });
});

describe('Deuda', () => {
  it('suma lo que corresponde y actualiza la fecha', () => {
    const d = deuda('tomas', 'ana', 100);
    d.sumar(ars(50), AHORA);
    expect(d.aDatos()).toMatchObject({ monto: ars(150), ultimaActualizacion: AHORA });
  });

  it('P15: A le debe 10.000 a B; A paga un gasto donde la parte de B es 4.000; queda A → B 6.000', () => {
    const aDebeAB = deuda('A', 'B', 10_000);
    const bDebeAA = deuda('B', 'A', 0);
    bDebeAA.sumar(ars(4_000), AHORA);
    bDebeAA.compensarCon(aDebeAB, AHORA);
    expect([aDebeAB.monto.monto, bDebeAA.monto.monto]).toEqual([6_000, 0]);
  });

  it('si la parte supera lo que se debía, la deuda cambia de sentido', () => {
    const aDebeAB = deuda('A', 'B', 1_000);
    const bDebeAA = deuda('B', 'A', 0);
    bDebeAA.sumar(ars(4_000), AHORA);
    bDebeAA.compensarCon(aDebeAB, AHORA);
    expect([aDebeAB.monto.monto, bDebeAA.monto.monto]).toEqual([0, 3_000]);
  });

  it('solo se compensa con la deuda opuesta del mismo par', () => {
    expect(() => deuda('A', 'B', 1).compensarCon(deuda('A', 'C', 1), AHORA)).toThrow(
      expect.objectContaining({ codigo: 'DEUDA_NO_OPUESTA' }),
    );
  });
});

describe('RN-E6: tipo de acceso', () => {
  it('completo si participa; solo saldos si se fue con saldos pendientes; ninguno si no', () => {
    expect(tipoDeAcceso('ACTIVA', false)).toBe('COMPLETO');
    expect(tipoDeAcceso('ACTIVA', true)).toBe('COMPLETO');
    expect(tipoDeAcceso('ELIMINADA', true)).toBe('SOLO_SALDOS');
    expect(tipoDeAcceso('RETIRADA', true)).toBe('SOLO_SALDOS');
    expect(tipoDeAcceso('RETIRADA', false)).toBeNull();
  });
});
