import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GastoVista } from '@viajes/compartido';
import { CLIENTE_GASTOS } from '../src/clientes/gastos';
import { useSesionStore } from '../src/stores/sesion';
import GastosVista from '../src/vistas/GastosVista.vue';
import {
  ANA,
  abrirViaje,
  clienteAuthFalso,
  clienteGastosFalso,
  clienteViajesFalso,
  montaje,
} from './soporte/clientesFalsos';

const ana = { id: 'ana', nombre: 'Ana', apodo: null };
const gasto = (id: string, creadoEn: Date): GastoVista => ({
  id,
  titulo: `Gasto ${id}`,
  categoria: { id: 'c1', codigo: 'COMIDA', nombre: 'Comida' },
  monto: 100_000,
  modoDivision: 'IGUALES',
  pagadoPor: ana,
  registradoPor: ana,
  creadoEn: creadoEn.toISOString(),
  partes: [{ usuario: ana, monto: 100_000 }],
});
const deuda = (monto: number) => ({
  id: `d${monto}`,
  contraparte: { id: 'tomas', nombre: 'Tomás', apodo: null },
  monto,
  ultimaActualizacion: '2026-10-14T12:00:00.000Z',
  pagos: [],
});

async function montar(debo: number, meDeben: number, gastos: GastoVista[] = []) {
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
    [CLIENTE_GASTOS as symbol]: clienteGastosFalso({
      listar: async () => gastos,
      deudas: async (_v, rol) =>
        rol === 'deudor' ? (debo ? [deuda(debo)] : []) : meDeben ? [deuda(meDeben)] : [],
    }),
  });
  await abrirViaje(opciones);
  useSesionStore().usuario = ANA;
  const vista = mount(GastosVista, opciones);
  await flushPromises();
  return vista;
}

afterEach(() => vi.useRealTimers());

describe('GastosVista como billetera', () => {
  it('muestra el balance neto: lo que te deben menos lo que debés', async () => {
    const aFavor = await montar(30_000, 500_000);
    expect(aFavor.find('.billetera__rotulo').text()).toBe('Te deben');
    expect(aFavor.find('.billetera__monto').text()).toMatch(/\$\s?4\.700,00/);
    expect(aFavor.find('.billetera__detalle').text()).toMatch(
      /Debés \$\s?300,00 · Te deben \$\s?5\.000,00/,
    );
    const enContra = await montar(500_000, 0);
    expect(enContra.find('.billetera__rotulo').text()).toBe('Debés');
    expect(enContra.find('.billetera__monto').classes()).toContain('billetera__monto--debo');
    const alDia = await montar(0, 0);
    expect(alDia.find('.billetera__rotulo').text()).toBe('Estás al día');
  });

  it('ofrece accesos rápidos y agrupa la actividad por día', async () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 15, 12, 0), toFake: ['Date'] });
    const vista = await montar(0, 0, [
      gasto('g1', new Date(2026, 9, 15, 10, 0)),
      gasto('g2', new Date(2026, 9, 15, 9, 0)),
      gasto('g3', new Date(2026, 8, 24, 21, 0)),
    ]);
    expect(vista.findAll('.acceso').map((a) => a.text())).toEqual([
      'Anotar gasto',
      'Pagar',
      'Me deben',
    ]);
    expect(vista.findAll('.dia__titulo').map((d) => d.text())).toEqual(['Hoy', '24 sep']);
    expect(vista.findAll('.dia')[0]!.findAll('.gasto')).toHaveLength(2);
  });
});
