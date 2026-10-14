import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import DialogoTraspaso from '../src/componentes/viajes/DialogoTraspaso.vue';
import { useViajeStore } from '../src/stores/viaje';
import {
  abrirViaje,
  clienteAuthFalso,
  clienteViajesFalso,
  errorDeApi,
  montaje,
} from './soporte/clientesFalsos';

async function montar(transferirAdministracion = vi.fn(async () => undefined)) {
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso({ transferirAdministracion }));
  await abrirViaje(opciones);
  await useViajeStore().cargarParticipantes();
  const dialogo = mount(DialogoTraspaso, { ...opciones, props: { miId: 'ana' } });
  await flushPromises();
  return { dialogo, transferirAdministracion };
}

describe('DialogoTraspaso (CU24)', () => {
  it('ofrece a los demás participantes y exige elegir uno', async () => {
    const { dialogo, transferirAdministracion } = await montar();
    const opciones = dialogo.findAll('#sucesor option').map((o) => o.text());
    expect(opciones).toEqual(['Elegí a un participante', 'Tomás (Tomi)']);
    await dialogo.findAll('button')[1]!.trigger('click');
    expect(dialogo.text()).toContain('Elegí quién va a ser el nuevo Admin');
    expect(transferirAdministracion).not.toHaveBeenCalled();
  });

  it('transfiere al elegido y se cierra', async () => {
    const { dialogo, transferirAdministracion } = await montar();
    await dialogo.find('#sucesor').setValue('tomas');
    await dialogo.findAll('button')[1]!.trigger('click');
    await flushPromises();
    expect(transferirAdministracion).toHaveBeenCalledWith('v1', 'tomas');
    expect(dialogo.emitted('cerrar')).toHaveLength(1);
  });

  it('si la API rechaza el traspaso, muestra el motivo y no se cierra', async () => {
    const { dialogo } = await montar(
      vi.fn(async () => {
        throw errorDeApi('SUCESOR_INVALIDO', 'El nuevo Admin tiene que ser otro participante');
      }),
    );
    await dialogo.find('#sucesor').setValue('tomas');
    await dialogo.findAll('button')[1]!.trigger('click');
    await flushPromises();
    expect(dialogo.text()).toContain('El nuevo Admin tiene que ser otro participante');
    expect(dialogo.emitted('cerrar')).toBeUndefined();
  });
});
