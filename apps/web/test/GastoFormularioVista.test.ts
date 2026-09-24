import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLIENTE_GASTOS, type ClienteGastos } from '../src/clientes/gastos';
import { ErrorDeApi } from '../src/clientes/http';
import { useSesionStore } from '../src/stores/sesion';
import GastoFormularioVista from '../src/vistas/GastoFormularioVista.vue';
import {
  ANA,
  abrirViaje,
  clienteAuthFalso,
  clienteGastosFalso,
  clienteViajesFalso,
  montaje,
} from './soporte/clientesFalsos';

const push = vi.fn();
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));

// El esquema exige identificadores UUID, como los que da la API.
const [ANA_ID, TOMAS_ID, CATEGORIA] = [
  '00000000-0000-4000-8000-00000000000a',
  '00000000-0000-4000-8000-00000000000b',
  '00000000-0000-4000-8000-00000000000c',
];

async function montar(parcial: Partial<ClienteGastos> = {}) {
  const opciones = montaje(
    clienteAuthFalso(),
    clienteViajesFalso({
      participantes: async () => [
        { usuarioId: ANA_ID, nombre: 'Ana', apodo: null, rol: 'ADMIN' },
        { usuarioId: TOMAS_ID, nombre: 'Tomás', apodo: 'Tomi', rol: 'VIAJERO' },
      ],
    }),
    {
      [CLIENTE_GASTOS as symbol]: clienteGastosFalso({
        categorias: async () => [{ id: CATEGORIA, codigo: 'COMIDA', nombre: 'Comida' }],
        ...parcial,
      }),
    },
  );
  await abrirViaje(opciones);
  useSesionStore().usuario = { ...ANA, id: ANA_ID };
  const vista = mount(GastoFormularioVista, opciones);
  await flushPromises();
  return vista;
}

beforeEach(() => push.mockReset());

describe('GastoFormularioVista', () => {
  it('P12 y P13: paga quien anota, nadie elegido y no se puede guardar sin elegidos', async () => {
    const vista = await montar();
    expect((vista.find('#gasto-pagador').element as HTMLSelectElement).value).toBe(ANA_ID);
    expect(vista.find('#gasto-pagador').text()).toContain('Yo');
    expect(vista.findAll('input[type="checkbox"]:checked')).toHaveLength(0);
    expect(vista.find('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  it('RN-G1: la categoría no viene elegida y es obligatoria', async () => {
    const anotar = vi.fn();
    const vista = await montar({ anotar });
    expect((vista.find('#gasto-categoria').element as HTMLSelectElement).value).toBe('');
    await vista.find('#gasto-titulo').setValue('Nafta');
    await vista.find('#gasto-monto').setValue('10');
    await vista.find('.selector-deudores button').trigger('click');
    await vista.find('form').trigger('submit');
    expect(anotar).not.toHaveBeenCalled();
    expect(vista.text()).toContain('Elegí una categoría');
  });

  it('RN-G4: en partes iguales muestra el reparto con el resto en los primeros', async () => {
    const vista = await montar();
    await vista.find('#gasto-monto').setValue('10,01');
    await vista.find('.selector-deudores button').trigger('click');
    const filas = vista.findAll('.tabla-partes tbody tr').map((f) => f.text());
    expect(filas[0]).toMatch(/Ana\$\s?5,01/);
    expect(filas[1]).toMatch(/Tomás \(Tomi\)\$\s?5,00/);
  });

  it('RN-G4: en división arbitraria muestra la diferencia mientras se escribe y envía las partes', async () => {
    const anotar = vi.fn<ClienteGastos['anotar']>().mockResolvedValue({} as never);
    const vista = await montar({ anotar });
    await vista.find('#gasto-titulo').setValue('Nafta');
    await vista.find('#gasto-categoria').setValue(CATEGORIA);
    await vista.find('#gasto-monto').setValue('1000');
    await vista.find('.selector-deudores button').trigger('click');
    await vista.find('input[value="ARBITRARIA"]').setValue(true);
    await vista.find(`#parte-${ANA_ID}`).setValue('600');
    expect(vista.find('.diferencia').text()).toMatch(/Falta asignar\$\s?400,00/);
    await vista.find(`#parte-${TOMAS_ID}`).setValue('500');
    expect(vista.find('.diferencia').text()).toMatch(/Sobra\$\s?100,00/);
    await vista.find(`#parte-${TOMAS_ID}`).setValue('400');
    expect(vista.find('.diferencia').attributes('data-cuadra')).toBe('true');
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(anotar).toHaveBeenCalledWith('v1', {
      titulo: 'Nafta',
      categoriaId: CATEGORIA,
      monto: 100_000,
      pagadoPorId: ANA_ID,
      deudores: [ANA_ID, TOMAS_ID],
      modoDivision: 'ARBITRARIA',
      partes: [
        { usuarioId: ANA_ID, monto: 60_000 },
        { usuarioId: TOMAS_ID, monto: 40_000 },
      ],
    });
    expect(push).toHaveBeenCalledWith('/viajes/v1/gastos');
  });

  it('si la API rechaza la suma, explica cuánto falta', async () => {
    const vista = await montar({
      anotar: async () => {
        throw new ErrorDeApi(422, 'SUMA_NO_COINCIDE', 'No coincide', {
          total: 1000,
          suma: 900,
          diferencia: 100,
        });
      },
    });
    await vista.find('#gasto-titulo').setValue('Nafta');
    await vista.find('#gasto-categoria').setValue(CATEGORIA);
    await vista.find('#gasto-monto').setValue('10');
    await vista.find('.selector-deudores button').trigger('click');
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(vista.find('.error-partes').text()).toMatch(/faltan \$\s?1,00/);
    expect(push).not.toHaveBeenCalled();
  });
});
