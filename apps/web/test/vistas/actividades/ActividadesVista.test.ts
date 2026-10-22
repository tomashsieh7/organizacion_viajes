import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { CLIENTE_PROPUESTAS, type ClientePropuestas } from '../../../src/clientes/propuestas';
import { useCelebracion } from '../../../src/composables/useCelebracion';
import ActividadesVista from '../../../src/vistas/actividades/ActividadesVista.vue';
import {
  abrirViaje,
  actividad,
  clienteAuthFalso,
  clienteViajesFalso,
  detalle,
  errorDeApi,
  montaje,
} from '../../soporte/clientesFalsos';
import { ErrorDeApi } from '../../../src/clientes/http';

async function montar(cliente: Partial<ClientePropuestas>, miRol: 'ADMIN' | 'VIAJERO' = 'ADMIN') {
  const opciones = montaje(
    clienteAuthFalso(),
    clienteViajesFalso({ obtener: async () => detalle(miRol) }),
    { [CLIENTE_PROPUESTAS as symbol]: cliente },
  );
  await abrirViaje(opciones);
  const vista = mount(ActividadesVista, opciones);
  await flushPromises();
  return vista;
}

const kayak = actividad('k', 'Kayak');
const trekking = actividad('t', 'Trekking', { alternativaDe: { id: 'k', titulo: 'Kayak' } });
const cena = actividad('c', 'Cena', { horaInicio: '21:00', estado: 'CONFIRMADA' });

describe('ActividadesVista', () => {
  it('lista las actividades con su horario y las alternativas anidadas', async () => {
    const vista = await montar({ listarActividades: async () => [kayak, trekking, cena] });
    const alternativas = vista.find('.alternativas');
    expect(alternativas.text()).toContain('Trekking');
    expect(alternativas.text()).not.toContain('Cena');
    expect(vista.text()).toContain('11 dic 2026 · 10:00 a 12:00 (2 h)');
    // Solo las pendientes admiten alternativas.
    expect(vista.findAll('.proponer-alternativa')).toHaveLength(2);
  });

  it('RN-R4: al confirmar una opción recarga la lista para mostrar las denegadas', async () => {
    let lista = [kayak, trekking];
    const listarActividades = vi.fn(async () => lista);
    const resolver = vi.fn(async () => {
      lista = [
        { ...kayak, estado: 'DENEGADA' as const },
        { ...trekking, estado: 'CONFIRMADA' as const },
      ];
      return { propuesta: lista[1]!, afectadas: ['k'] };
    });
    const vista = await montar({ listarActividades, resolver });
    const confirmar = vista.findAll('.alternativas button').find((b) => b.text() === 'Confirmar')!;
    await confirmar.trigger('click');
    await flushPromises();
    expect(resolver).toHaveBeenCalledWith('v1', 't', 'confirmar');
    expect(listarActividades).toHaveBeenCalledTimes(2);
    expect(vista.find('[data-estado="DENEGADA"]').text()).toContain('Kayak');
    // Confirmar celebra con el nombre de la actividad.
    expect(useCelebracion().celebracion.value?.mensaje).toBe('¡Confirmaron Trekking!');
    useCelebracion().cerrar();
  });

  it('RN-R3: si al confirmar choca con otra confirmada, muestra con cuál', async () => {
    const conflicto = {
      id: 'c',
      titulo: 'Cena',
      fecha: '2026-12-11',
      horaInicio: '09:00',
      duracionMin: 90,
    };
    const vista = await montar({
      listarActividades: async () => [kayak],
      resolver: async () => {
        throw new ErrorDeApi(409, 'SUPERPOSICION_HORARIA', 'Se superpone', {
          conflictos: [conflicto],
        });
      },
    });
    await vista
      .findAll('button')
      .find((b) => b.text() === 'Confirmar')!
      .trigger('click');
    await flushPromises();
    expect(vista.find('.aviso-superposicion').text()).toContain(
      'Cena, 11 dic 2026 · 09:00 a 10:30',
    );
    expect(vista.find('.aviso-superposicion').text()).toContain('primero hay que cancelar');
  });

  it('si la propuesta ya cambió de estado al votar, avisa y muestra cómo quedó', async () => {
    let estado: typeof trekking.estado = 'PENDIENTE';
    const listarActividades = vi.fn(async () => [kayak, { ...trekking, estado }]);
    const votar = vi.fn(async () => {
      estado = 'DENEGADA'; // el Admin confirmó otra opción del grupo con la lista abierta
      throw errorDeApi('PROPUESTA_NO_PENDIENTE', 'La propuesta ya fue resuelta', 409);
    });
    const vista = await montar({ listarActividades, votar }, 'VIAJERO');
    const tarjetaTrekking = () =>
      vista.findAll('article').find((a) => a.text().includes('Trekking'))!;
    await tarjetaTrekking()
      .findAll('button')
      .find((b) => b.text() === 'A favor')!
      .trigger('click');
    await flushPromises();
    expect(vista.find('[role="alert"]').text()).toContain('La propuesta ya fue resuelta');
    expect(tarjetaTrekking().text()).toContain('Denegada');
    expect(
      tarjetaTrekking()
        .findAll('button')
        .some((b) => b.text() === 'A favor'),
    ).toBe(false);
  });

  it('muestra los demás errores como mensaje', async () => {
    const vista = await montar({
      listarActividades: async () => {
        throw errorDeApi('ERROR_INTERNO', 'Falló la carga', 500);
      },
    });
    expect(vista.text()).toContain('Falló la carga');
  });

  it('mientras se resuelve una propuesta, un segundo clic no manda otro pedido', async () => {
    let terminar!: () => void;
    const resolver = vi.fn(
      () =>
        new Promise<{ propuesta: typeof kayak; afectadas: string[] }>((ok) => {
          terminar = () => ok({ propuesta: { ...kayak, estado: 'CONFIRMADA' }, afectadas: [] });
        }),
    );
    const vista = await montar({ listarActividades: async () => [kayak], resolver });
    const confirmar = () => vista.findAll('button').find((b) => b.text() === 'Confirmar')!;
    await confirmar().trigger('click');
    expect(confirmar().attributes('disabled')).toBeDefined();
    await confirmar().trigger('click');
    expect(resolver).toHaveBeenCalledTimes(1);
    terminar();
    await flushPromises();
    expect(vista.text()).not.toContain('ya está resuelta');
  });
});
