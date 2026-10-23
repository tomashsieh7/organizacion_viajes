import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GastoVista, PagoDeActividad } from '@viajes/compartido';
import { CLIENTE_GASTOS } from '../../../src/clientes/gastos';
import { useSesionStore } from '../../../src/stores/sesion';
import GastosVista from '../../../src/vistas/gastos/GastosVista.vue';
import {
  ANA,
  abrirViaje,
  clienteAuthFalso,
  clienteGastosFalso,
  clienteViajesFalso,
  montaje,
} from '../../soporte/clientesFalsos';

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

async function montar(
  debo: number,
  meDeben: number,
  gastos: GastoVista[] = [],
  pagos: PagoDeActividad[] = [],
) {
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
    [CLIENTE_GASTOS as symbol]: clienteGastosFalso({
      listar: async () => gastos,
      pagos: async () => pagos,
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

  it('mezcla los pagos propios con los gastos, por fecha', async () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 15, 12, 0), toFake: ['Date'] });
    const tomas = { id: 'tomas', nombre: 'Tomás', apodo: null };
    const pago = (id: string, fecha: Date, deudor: typeof ana, acreedor: typeof ana) => ({
      id,
      monto: 40_000,
      fecha: fecha.toISOString(),
      deudor,
      acreedor,
    });
    const vista = await montar(
      0,
      0,
      [gasto('g1', new Date(2026, 9, 15, 10, 0))],
      [
        pago('p1', new Date(2026, 9, 15, 11, 0), tomas, ana),
        pago('p2', new Date(2026, 8, 24, 9, 0), ana, tomas),
      ],
    );
    const hoy = vista.findAll('.dia')[0]!;
    expect(hoy.findAll('.pago, .gasto').map((m) => m.classes()[0])).toEqual(['pago', 'gasto']);
    expect(hoy.find('.pago').text()).toMatch(/^Tomás te pagóPago · 11:00\+ \$\s400,00$/);
    expect(hoy.find('.pago .monto').classes()).toContain('monto--recibido');
    const antes = vista.findAll('.dia')[1]!;
    expect(antes.find('.dia__titulo').text()).toBe('24 sep');
    expect(antes.find('.pago__titulo').text()).toBe('Le pagaste a Tomás');
    // Con pagos y sin gastos, la actividad no está vacía.
    const soloPagos = await montar(0, 0, [], [pago('p3', new Date(), ana, tomas)]);
    expect(soloPagos.text()).not.toContain('Todavía no hay gastos anotados.');
  });
});

/**
 * Observador falso: avisa que el final de la lista está a la vista cuando la prueba lo pide, y
 * también al empezar a observarlo si ya lo está, como hace el navegador.
 */
let finalVisible = false;
const observadores: { avisar: () => void }[] = [];
class ObservadorFalso {
  private elementos = new Set<Element>();
  constructor(private alCambiar: (e: { isIntersecting: boolean }[]) => void) {
    observadores.push(this);
  }
  avisar() {
    if (this.elementos.size) this.alCambiar([{ isIntersecting: finalVisible }]);
  }
  observe(e: Element) {
    this.elementos.add(e);
    this.avisar();
  }
  unobserve(e: Element) {
    this.elementos.delete(e);
  }
  disconnect() {
    this.elementos.clear();
  }
}

describe('GastosVista con muchos movimientos', () => {
  const muchos = (n: number) =>
    Array.from({ length: n }, (_, i) => gasto(`g${i}`, new Date(2026, 9, 20, 12, 60 - i)));

  afterEach(() => {
    vi.unstubAllGlobals();
    observadores.length = 0;
  });

  it('muestra 15 y suma otros 15 al llegar al final, hasta que no quedan', async () => {
    finalVisible = false;
    vi.stubGlobal('IntersectionObserver', ObservadorFalso);
    const vista = await montar(0, 0, muchos(40));
    expect(vista.findAll('.lista > *')).toHaveLength(15);
    // Del más reciente al más viejo, sin saltear ninguno.
    expect(vista.text()).toContain('Gasto g0');
    expect(vista.text()).not.toContain('Gasto g15');
    expect(vista.text()).not.toContain('No hay más movimientos.');

    finalVisible = true;
    observadores.at(-1)!.avisar();
    await flushPromises();
    // Con el final todavía a la vista, se siguen sumando tandas hasta mostrar todos.
    expect(vista.findAll('.lista > *')).toHaveLength(40);
    expect(vista.find('.actividad__final').exists()).toBe(false);
    expect(vista.text()).toContain('No hay más movimientos.');
  });

  it('si el final no llega a verse, no suma nada', async () => {
    finalVisible = false;
    vi.stubGlobal('IntersectionObserver', ObservadorFalso);
    const vista = await montar(0, 0, muchos(20));
    observadores.at(-1)!.avisar();
    await flushPromises();
    expect(vista.findAll('.lista > *')).toHaveLength(15);
  });

  it('con pocos movimientos no hay tandas ni aviso de final', async () => {
    vi.stubGlobal('IntersectionObserver', ObservadorFalso);
    const vista = await montar(0, 0, muchos(15));
    expect(vista.findAll('.lista > *')).toHaveLength(15);
    expect(vista.find('.actividad__final').exists()).toBe(false);
    expect(vista.text()).not.toContain('No hay más movimientos.');
  });
});
