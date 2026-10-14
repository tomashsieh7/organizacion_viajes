import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import type { ActividadVista, AlojamientoVista } from '@viajes/compartido';
import { CLIENTE_PROPUESTAS } from '../src/clientes/propuestas';
import { useCelebracion } from '../src/composables/useCelebracion';
import ResumenVista from '../src/vistas/ResumenVista.vue';
import { diasEntre } from '../src/utiles/fechas';
import {
  abrirViaje,
  actividad,
  clienteAuthFalso,
  clienteViajesFalso,
  detalle,
  errorDeApi,
  montaje,
} from './soporte/clientesFalsos';

async function montar(
  datos: { alojamientos?: AlojamientoVista[]; actividades?: ActividadVista[] } = {},
  miRol: 'ADMIN' | 'VIAJERO' = 'ADMIN',
  fallar = false,
) {
  const listar =
    <T>(lista: T[] = []) =>
    async () => {
      if (fallar) throw errorDeApi('ERROR_INTERNO', 'Ocurrió un error inesperado', 500);
      return lista;
    };
  const opciones = montaje(
    clienteAuthFalso(),
    clienteViajesFalso({ obtener: async () => detalle(miRol) }),
    {
      [CLIENTE_PROPUESTAS as symbol]: {
        listarAlojamientos: listar(datos.alojamientos),
        listarActividades: listar(datos.actividades),
      },
    },
  );
  await abrirViaje(opciones);
  const vista = mount(ResumenVista, opciones);
  await flushPromises();
  return vista;
}

/** Un viaje del 10 al 16 de diciembre con todo cubierto: alojamiento y una actividad por día. */
function todoListo() {
  const cabana = {
    ...actividad('a', 'x', { estado: 'CONFIRMADA' }),
    tipo: 'ALOJAMIENTO',
    alojamiento: { nombre: 'Cabaña', fechaDesde: '2026-12-10', fechaHasta: '2026-12-16' },
  } as unknown as AlojamientoVista;
  const actividades = diasEntre('2026-12-10', '2026-12-16').map((fecha, i) => {
    const a = actividad(`d${i}`, `Paseo ${i}`, { estado: 'CONFIRMADA' });
    return { ...a, actividad: { ...a.actividad, fecha } };
  });
  return { alojamientos: [cabana], actividades };
}

afterEach(() => {
  localStorage.clear();
  useCelebracion().cerrar();
});

describe('ResumenVista', () => {
  it('muestra el progreso, los hitos y los próximos pasos de un viaje sin planificar', async () => {
    const vista = await montar();
    // Se sumó el grupo y las cuentas están al día: 2 de 6 hitos.
    expect(vista.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('33');
    expect(vista.text()).toContain('Completaron 2 de 6 hitos del viaje.');
    expect(vista.text()).toContain('6 noches sin lugar');
    const pasos = vista.findAll('.paso');
    expect(pasos[0]!.text()).toContain('Faltan 6 noches de alojamiento');
    expect(pasos[0]!.find('.boton--principal').exists()).toBe(true);
    expect(pasos[1]!.text()).toContain('7 días sin actividades');
    expect(pasos[1]!.find('.boton--principal').exists()).toBe(false);
  });

  it('las decisiones pendientes son un paso solo para el Admin; el voto, para todos', async () => {
    const kayak = actividad('k', 'Kayak');
    const admin = await montar({ actividades: [kayak] }, 'ADMIN');
    expect(admin.text()).toContain('1 propuesta espera tu decisión');
    expect(admin.text()).toContain('Te falta votar 1 propuesta');
    const viajero = await montar({ actividades: [kayak] }, 'VIAJERO');
    expect(viajero.text()).not.toContain('espera tu decisión');
    expect(viajero.text()).toContain('Te falta votar 1 propuesta');
  });

  it('al 100 % celebra una sola vez por viaje', async () => {
    const { celebracion } = useCelebracion();
    const vista = await montar(todoListo());
    expect(vista.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('100');
    expect(vista.text()).toContain('¡Todo listo para viajar!');
    expect(vista.text()).toContain('No queda nada pendiente');
    expect(celebracion.value?.mensaje).toBe('¡Bariloche está listo para viajar!');

    useCelebracion().cerrar();
    await montar(todoListo());
    expect(celebracion.value).toBeNull();
  });

  it('si la carga falla, muestra el error', async () => {
    const vista = await montar({}, 'ADMIN', true);
    expect(vista.text()).toContain('Ocurrió un error inesperado');
    expect(vista.find('[role="progressbar"]').exists()).toBe(false);
  });
});
