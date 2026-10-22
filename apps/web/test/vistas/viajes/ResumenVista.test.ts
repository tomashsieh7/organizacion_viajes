import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ActividadVista, AlojamientoVista } from '@viajes/compartido';
import { CLIENTE_PROPUESTAS } from '../../../src/clientes/propuestas';
import { useCelebracion } from '../../../src/composables/useCelebracion';
import ResumenVista from '../../../src/vistas/viajes/ResumenVista.vue';
import { diasEntre } from '../../../src/utiles/fechas';
import {
  abrirViaje,
  actividad,
  clienteAuthFalso,
  clienteViajesFalso,
  detalle,
  errorDeApi,
  montaje,
} from '../../soporte/clientesFalsos';

async function montar(
  datos: { alojamientos?: AlojamientoVista[]; actividades?: ActividadVista[] } = {},
  miRol: 'ADMIN' | 'VIAJERO' = 'ADMIN',
  fallar = false,
  miDeudaPendiente = 0,
) {
  const listar =
    <T>(lista: T[] = []) =>
    async () => {
      if (fallar) throw errorDeApi('ERROR_INTERNO', 'Ocurrió un error inesperado', 500);
      return lista;
    };
  const opciones = montaje(
    clienteAuthFalso(),
    clienteViajesFalso({ obtener: async () => detalle(miRol, miDeudaPendiente) }),
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
  vi.useRealTimers();
  localStorage.clear();
  useCelebracion().cerrar();
});

describe('ResumenVista', () => {
  it('destaca un solo paso y pliega el resto y los hitos, en un viaje sin planificar', async () => {
    const vista = await montar();
    // Primero lo próximo, después el progreso.
    expect(vista.findAll('h3').map((h) => h.text())).toEqual([
      'Lo próximo',
      'El viaje va tomando forma',
    ]);
    const principal = vista.find('.paso--principal');
    expect(principal.text()).toContain('Faltan 6 noches de alojamiento');
    expect(principal.find('.boton--principal').text()).toBe('Proponer');
    // Una sola acción destacada en la pantalla.
    expect(vista.findAll('.boton--principal')).toHaveLength(1);

    const [pasos, hitos] = vista.findAll('details');
    expect(pasos!.find('summary').text()).toBe('Ver 1 paso más');
    expect(pasos!.text()).toContain('7 días sin actividades');
    // Se sumó el grupo y las cuentas están al día: 2 de 6 hitos.
    expect(vista.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('33');
    expect(vista.text()).toContain('2 de 6 hitos del viaje listos');
    expect(hitos!.find('summary').text()).toBe('Ver los hitos');
    expect(hitos!.text()).toContain('6 noches sin lugar');
    // Los desplegables arrancan cerrados.
    expect(pasos!.attributes('open')).toBeUndefined();
    expect(hitos!.attributes('open')).toBeUndefined();
  });

  it('la cuenta regresiva ya no está en el Resumen: queda en la portada', async () => {
    const vista = await montar();
    expect(vista.find('[aria-label="Cuenta regresiva"]').exists()).toBe(false);
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

  it('con el viaje en curso, lo pendiente se cuenta desde hoy', async () => {
    // Del 10 al 16, hoy es el 13: quedan las noches del 13 al 15 y los días del 13 al 16.
    vi.useFakeTimers({ now: new Date(2026, 11, 13, 12, 0), toFake: ['Date'] });
    const vista = await montar();
    expect(vista.find('.paso--principal').text()).toContain('Faltan 3 noches de alojamiento');
    expect(vista.findAll('details')[0]!.text()).toContain('4 días sin actividades');
  });

  it('con el viaje terminado, no propone planificar y solo quedan las deudas', async () => {
    vi.useFakeTimers({ now: new Date(2026, 11, 20, 12, 0), toFake: ['Date'] });
    const conDeuda = await montar({}, 'ADMIN', false, 50_000);
    expect(conDeuda.findAll('h3').map((h) => h.text())).toEqual(['Lo próximo', 'El viaje terminó']);
    expect(conDeuda.find('.paso--principal').text()).toContain('Tenés deudas por saldar');
    expect(conDeuda.findAll('details')).toHaveLength(0);
    expect(conDeuda.text()).toContain('Te quedan deudas por saldar con el grupo.');
    expect(conDeuda.text()).not.toContain('%');

    const alDia = await montar(todoListo());
    expect(alDia.text()).toContain('No queda nada pendiente');
    expect(alDia.text()).toContain('Tus cuentas con el grupo están al día.');
    // Un viaje que ya terminó no se celebra como listo para viajar.
    expect(useCelebracion().celebracion.value).toBeNull();
  });
});
