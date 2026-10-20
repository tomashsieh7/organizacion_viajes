import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { ClienteGastos } from '../../../src/clientes/gastos';
import { CLIENTE_GASTOS } from '../../../src/clientes/gastos';
import ParticipantesVista from '../../../src/vistas/viajes/ParticipantesVista.vue';
import { useSesionStore } from '../../../src/stores/sesion';
import { useViajeStore } from '../../../src/stores/viajes';
import {
  clienteAuthFalso,
  clienteGastosFalso,
  clienteViajesFalso,
  detalle,
  errorDeApi,
  montaje,
} from '../../soporte/clientesFalsos';

const push = vi.fn();
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));

/** Una deuda de ejemplo con Ana, de `monto` en la unidad mínima. */
const deudaCon = (monto: number) => ({
  id: 'd1',
  contraparte: { id: 'ana', nombre: 'Ana', apodo: null },
  monto,
  ultimaActualizacion: '2026-10-20T12:00:00Z',
  pagos: [],
});

async function montarComo(
  miRol: 'ADMIN' | 'VIAJERO',
  miId: string,
  extra = {},
  gastos: Partial<ClienteGastos> = {},
) {
  const viajes = clienteViajesFalso({ obtener: async () => detalle(miRol, 150_000), ...extra });
  const opciones = montaje(clienteAuthFalso(), viajes, {
    [CLIENTE_GASTOS as symbol]: clienteGastosFalso(gastos),
  });
  const vista = mount(ParticipantesVista, opciones);
  useSesionStore().usuario = { id: miId, nombre: 'Yo', apodo: null };
  // Como en ViajeLayout: la vista trabaja sobre un viaje ya abierto.
  await useViajeStore().abrir('v1');
  await useViajeStore().cargarParticipantes();
  await flushPromises();
  return vista;
}

describe('ParticipantesVista', () => {
  it('muestra al Admin el formulario para agregar y el traspaso', async () => {
    const vista = await montarComo('ADMIN', 'ana');
    expect(vista.find('#agregar-email').exists()).toBe(true);
    expect(vista.text()).toContain('Transferir la administración');
    expect(vista.text()).toContain('Eliminar');
  });

  it('a un viajero común no le muestra acciones de Admin', async () => {
    const vista = await montarComo('VIAJERO', 'tomas');
    expect(vista.find('#agregar-email').exists()).toBe(false);
    expect(vista.text()).not.toContain('Transferir la administración');
    expect(vista.text()).not.toContain('Eliminar');
    expect(vista.text()).toContain('Salir del grupo');
  });

  const abrirSalir = async (vista: Awaited<ReturnType<typeof montarComo>>) => {
    await vista
      .findAll('button')
      .find((b) => b.text() === 'Salir del grupo')!
      .trigger('click');
    await flushPromises();
  };
  const confirmarSalida = (vista: Awaited<ReturnType<typeof montarComo>>) =>
    vista.findAll('[role="dialog"] button').find((b) => b.text() === 'Salir del grupo')!;

  it('RN-E7: al salir se consulta la deuda del momento y se muestra antes de confirmar', async () => {
    // El viaje se abrió sin deuda en la página, pero alguien anotó un gasto después.
    const deudas = vi.fn(async (_viaje: string, rol: string) =>
      rol === 'deudor' ? [deudaCon(250_000)] : [],
    );
    const vista = await montarComo(
      'VIAJERO',
      'tomas',
      { obtener: async () => detalle('VIAJERO', 0) },
      { deudas },
    );
    await abrirSalir(vista);
    expect(deudas).toHaveBeenCalledWith('v1', 'deudor');
    expect(vista.text()).toMatch(/Todavía debés \$\s?2\.500,00/);
    expect(vista.text()).not.toContain('Te deben');
  });

  it('RN-E6: al salir con saldo a favor avisa cuánto le deben y que lo sigue viendo en saldos', async () => {
    const vista = await montarComo(
      'VIAJERO',
      'tomas',
      {},
      {
        deudas: async (_viaje, rol) => (rol === 'acreedor' ? [deudaCon(600_000)] : []),
      },
    );
    await abrirSalir(vista);
    expect(vista.text()).toMatch(/Te deben \$\s?6\.000,00/);
    expect(vista.text()).toContain('Vas a poder seguir viéndolo en saldos');
    expect(vista.text()).toContain('Tu historial de gastos y mensajes se conserva');
  });

  it('RN-E7: hasta tener los saldos no se puede confirmar, y si fallan se puede reintentar', async () => {
    const deudas = vi
      .fn()
      .mockRejectedValueOnce(errorDeApi('SIN_CONEXION', 'No se pudo contactar al servidor', 0))
      .mockResolvedValue([]);
    const vista = await montarComo('VIAJERO', 'tomas', {}, { deudas });
    await abrirSalir(vista);
    expect(vista.text()).toContain('No se pudo contactar al servidor');
    expect(confirmarSalida(vista).attributes('disabled')).toBeDefined();
    await vista
      .findAll('[role="dialog"] button')
      .find((b) => b.text() === 'Reintentar')!
      .trigger('click');
    await flushPromises();
    expect(confirmarSalida(vista).attributes('disabled')).toBeUndefined();
  });

  it('RN-T3: el Admin no puede confirmar la salida sin elegir sucesor', async () => {
    const salir = vi.fn();
    const vista = await montarComo('ADMIN', 'ana', { salir });
    await abrirSalir(vista);
    await confirmarSalida(vista).trigger('click');
    expect(salir).not.toHaveBeenCalled();
    expect(vista.text()).toContain('tenés que elegir quién va a ser el nuevo Admin');
  });

  it('RN-E6 y RN-E7: quien sale con saldos pendientes queda en la sección de saldos', async () => {
    const resumen = { ...detalle('VIAJERO'), monedaCodigo: 'ARS' };
    const vista = await montarComo('VIAJERO', 'tomas', {
      salir: async () => ({ bajaConDeuda: true }),
      listar: async () => [{ ...resumen, miAcceso: 'SOLO_SALDOS' }],
    });
    await abrirSalir(vista);
    await confirmarSalida(vista).trigger('click');
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/viajes/v1/saldos');
    expect(useViajeStore().aviso).toContain('Podés seguir viendo tus saldos');
  });

  it('quien sale sin saldos vuelve a la lista con el aviso de que salió', async () => {
    const vista = await montarComo('VIAJERO', 'tomas', {
      salir: async () => ({ bajaConDeuda: false }),
      listar: async () => [],
    });
    push.mockClear();
    await abrirSalir(vista);
    await confirmarSalida(vista).trigger('click');
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/viajes');
    expect(useViajeStore().avisoLista).toBe('Saliste de «Bariloche».');
  });

  it('si la respuesta de eliminar se pierde, vuelve a pedir la lista para mostrar cómo quedó', async () => {
    let quedan = [
      { usuarioId: 'ana', nombre: 'Ana', apodo: null, rol: 'ADMIN' as const },
      { usuarioId: 'carla', nombre: 'Carla', apodo: null, rol: 'VIAJERO' as const },
    ];
    const eliminarParticipante = vi.fn(async () => {
      // El servidor la eliminó, pero la respuesta no llegó.
      quedan = quedan.filter((p) => p.usuarioId !== 'carla');
      throw errorDeApi('SIN_CONEXION', 'No se pudo contactar al servidor', 0);
    });
    const vista = await montarComo('ADMIN', 'ana', {
      eliminarParticipante,
      participantes: async () => quedan,
    });
    expect(vista.text()).toContain('Carla');
    await vista.find('[aria-label="Eliminar a Carla"]').trigger('click');
    await vista
      .findAll('[role="dialog"] button')
      .find((b) => b.text() === 'Eliminar')!
      .trigger('click');
    await flushPromises();
    expect(vista.text()).toContain('No se pudo contactar al servidor');
    expect(vista.find('[aria-label="Eliminar a Carla"]').exists()).toBe(false);
  });

  it('si la persona ya no estaba en el grupo, lo avisa y actualiza la lista', async () => {
    const participantes = vi.fn(async () => [
      { usuarioId: 'ana', nombre: 'Ana', apodo: null, rol: 'ADMIN' as const },
      { usuarioId: 'carla', nombre: 'Carla', apodo: null, rol: 'VIAJERO' as const },
    ]);
    const vista = await montarComo('ADMIN', 'ana', {
      participantes,
      eliminarParticipante: async () => {
        throw errorDeApi('NO_ENCONTRADO', 'Esa persona no participa del viaje', 404);
      },
    });
    const pedidosAntes = participantes.mock.calls.length;
    await vista.find('[aria-label="Eliminar a Carla"]').trigger('click');
    await vista
      .findAll('[role="dialog"] button')
      .find((b) => b.text() === 'Eliminar')!
      .trigger('click');
    await flushPromises();
    expect(vista.text()).toContain('Carla ya no está en el grupo.');
    expect(vista.text()).not.toContain('Esa persona no participa del viaje');
    expect(participantes.mock.calls.length).toBeGreaterThan(pedidosAntes);
  });

  it('al eliminar a un participante, un doble clic manda un solo pedido', async () => {
    let terminar!: () => void;
    const eliminarParticipante = vi.fn(
      () =>
        new Promise<{ bajaConDeuda: boolean }>(
          (ok) => (terminar = () => ok({ bajaConDeuda: false })),
        ),
    );
    const vista = await montarComo('ADMIN', 'ana', { eliminarParticipante });
    await vista
      .findAll('button')
      .find((b) => b.text() === 'Eliminar')!
      .trigger('click');
    const confirmar = () =>
      vista.findAll('[role="dialog"] button').find((b) => b.text() === 'Eliminar')!;
    await confirmar().trigger('click');
    expect(confirmar().attributes('disabled')).toBeDefined();
    await confirmar().trigger('click');
    expect(eliminarParticipante).toHaveBeenCalledTimes(1);
    terminar();
    await flushPromises();
    expect(vista.text()).toContain('Se eliminó a');
  });
});
