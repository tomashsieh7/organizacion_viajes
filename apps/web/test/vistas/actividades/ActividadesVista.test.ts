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

const replace = vi.fn(async (destino: { query: Record<string, string> }) => {
  consulta = destino.query;
});
let consulta: Record<string, string> = {};
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue');
  const ruta = reactive({ query: {} as Record<string, string> });
  return {
    useRoute: () => {
      ruta.query = consulta;
      return ruta;
    },
    useRouter: () => ({
      replace: async (destino: { query: Record<string, string> }) => {
        await replace(destino);
        ruta.query = destino.query;
      },
    }),
  };
});

async function montar(
  cliente: Partial<ClientePropuestas>,
  miRol: 'ADMIN' | 'VIAJERO' = 'ADMIN',
  dia?: string,
) {
  consulta = dia ? { dia } : {};
  replace.mockClear();
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
const museo = actividad('m', 'Museo', { fecha: '2026-12-13', horaInicio: '15:00' });

type Vista = Awaited<ReturnType<typeof montar>>;
/** Texto de cada renglón del día: hora, título y estado (los votos solo se leen en escritorio). */
const renglones = (vista: Vista) =>
  vista
    .findAll('.renglon__fila')
    .map((r) =>
      [r.find('.renglon__hora'), r.find('.renglon__titulo'), r.find('.insignia')]
        .map((x) => x.text())
        .join(' '),
    );
/** Toca el renglón de una propuesta para abrir (o cerrar) su tarjeta. */
async function abrir(vista: Vista, titulo: string) {
  await vista
    .findAll('.renglon__fila')
    .find((r) => r.find('.renglon__titulo').text().endsWith(titulo))!
    .trigger('click');
}
const boton = (vista: Vista, texto: string) =>
  vista.findAll('button').find((b) => b.text() === texto)!;

describe('ActividadesVista', () => {
  it('RN-C4: abre en el primer día con propuestas y lo guarda en la dirección', async () => {
    const vista = await montar({ listarActividades: async () => [museo, kayak, trekking, cena] });
    expect(replace).toHaveBeenCalledWith({ query: { dia: '2026-12-11' } });
    expect(vista.find('h3.dia').text()).toBe('Viernes 11 dic 3 propuestas · 2 pendientes');
    // P9: la alternativa va debajo de su original, con una «o»; las de otros días no se ven.
    expect(renglones(vista)).toEqual([
      '10:00 Kayak Pendiente',
      '10:00 o Trekking Pendiente',
      '21:00 Cena Confirmada',
    ]);
    expect(vista.find('.renglon--alternativa').text()).toContain('Trekking');
  });

  it('el título del día concuerda en singular con una sola propuesta pendiente', async () => {
    const vista = await montar({ listarActividades: async () => [kayak] });
    expect(vista.find('h3.dia').text()).toBe('Viernes 11 dic 1 propuesta · 1 pendiente');
  });

  it('al elegir otro día en el calendario muestra solo sus propuestas', async () => {
    const vista = await montar({ listarActividades: async () => [museo, kayak, cena] });
    await vista
      .findAll('.calendario__dias button')
      .find((b) => b.text().startsWith('13'))!
      .trigger('click');
    await flushPromises();
    expect(replace).toHaveBeenLastCalledWith({ query: { dia: '2026-12-13' } });
    expect(vista.find('h3.dia').text()).toContain('Domingo 13 dic');
    expect(renglones(vista)).toEqual(['15:00 Museo Pendiente']);
  });

  it('abre el día de la dirección, y si ese día no hay propuestas lo dice', async () => {
    const vista = await montar({ listarActividades: async () => [kayak] }, 'ADMIN', '2026-12-14');
    expect(replace).not.toHaveBeenCalled();
    expect(vista.find('h3.dia').text()).toBe('Lunes 14 dic 0 propuestas');
    expect(vista.text()).toContain('No hay actividades propuestas para este día.');
    expect(vista.find('.filtro').exists()).toBe(false);
  });

  it('un día que no es del viaje en la dirección se ignora', async () => {
    await montar({ listarActividades: async () => [kayak] }, 'ADMIN', '2027-01-01');
    expect(replace).toHaveBeenCalledWith({ query: { dia: '2026-12-11' } });
  });

  it('tocar un renglón abre la tarjeta completa, y tocarlo otra vez la cierra', async () => {
    const vista = await montar({ listarActividades: async () => [kayak, cena] });
    expect(vista.find('article').exists()).toBe(false);
    await abrir(vista, 'Kayak');
    const fila = vista.find('.renglon__fila');
    expect(fila.attributes('aria-expanded')).toBe('true');
    expect(vista.get(`#${fila.attributes('aria-controls')}`).text()).toContain(
      '11 dic 2026 · 10:00 a 12:00 (2 h)',
    );
    // Solo las pendientes admiten alternativas.
    expect(vista.findAll('.proponer-alternativa')).toHaveLength(1);
    await abrir(vista, 'Kayak');
    expect(vista.find('article').exists()).toBe(false);
  });

  it('el filtro cuenta las propuestas del día y permite ver varios estados', async () => {
    const vista = await montar({
      listarActividades: async () => [museo, kayak, trekking, cena],
    });
    const cantidades = vista.findAll('.filtro__cantidad').map((c) => c.text());
    expect(cantidades).toEqual(['3', '2', '1', '0', '0']);
    await boton(vista, 'Confirmadas1').trigger('click');
    expect(renglones(vista)).toEqual(['21:00 Cena Confirmada']);
    await boton(vista, 'Denegadas0').trigger('click');
    expect(renglones(vista)).toEqual(['21:00 Cena Confirmada']);
    await boton(vista, 'Confirmadas1').trigger('click');
    expect(vista.text()).toContain('No hay actividades con esos estados este día.');
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
    await abrir(vista, 'Trekking');
    await boton(vista, 'Confirmar').trigger('click');
    await flushPromises();
    expect(resolver).toHaveBeenCalledWith('v1', 't', 'confirmar');
    expect(listarActividades).toHaveBeenCalledTimes(2);
    expect(renglones(vista)).toEqual(['10:00 Kayak Denegada', '10:00 o Trekking Confirmada']);
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
    await abrir(vista, 'Kayak');
    await boton(vista, 'Confirmar').trigger('click');
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
    await abrir(vista, 'Trekking');
    const tarjetaTrekking = () =>
      vista.findAll('article').find((a) => a.text().includes('Trekking'))!;
    await tarjetaTrekking()
      .findAll('button')
      .find((b) => b.attributes('aria-label') === 'A favor')!
      .trigger('click');
    await flushPromises();
    expect(vista.find('[role="alert"]').text()).toContain('La propuesta ya fue resuelta');
    expect(tarjetaTrekking().text()).toContain('Denegada');
    expect(
      tarjetaTrekking()
        .findAll('button')
        .some((b) => b.attributes('aria-label') === 'A favor'),
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
    await abrir(vista, 'Kayak');
    const confirmar = () => boton(vista, 'Confirmar');
    await confirmar().trigger('click');
    expect(confirmar().attributes('disabled')).toBeDefined();
    await confirmar().trigger('click');
    expect(resolver).toHaveBeenCalledTimes(1);
    terminar();
    await flushPromises();
    expect(vista.text()).not.toContain('ya está resuelta');
  });
});
