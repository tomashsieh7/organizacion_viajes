import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ListaParticipantes from '../src/componentes/viajes/ListaParticipantes.vue';
import { TOMAS } from './soporte/clientesFalsos';

const participantes = [
  { usuarioId: 'ana', nombre: 'Ana', apodo: null, rol: 'ADMIN' as const },
  TOMAS,
];

describe('ListaParticipantes', () => {
  it('RN-X2: el Admin ve el botón de eliminar para los demás, no para sí mismo', async () => {
    const vista = mount(ListaParticipantes, {
      props: { participantes, soyAdmin: true, miId: 'ana' },
    });
    const botones = vista.findAll('button');
    expect(botones.map((b) => b.attributes('aria-label'))).toEqual(['Eliminar a Tomás']);
    await botones[0]!.trigger('click');
    expect(vista.emitted('eliminar')?.[0]).toEqual([TOMAS]);
  });

  it('un viajero común no ve acciones de Admin', () => {
    const vista = mount(ListaParticipantes, {
      props: { participantes, soyAdmin: false, miId: 'tomas' },
    });
    expect(vista.findAll('button')).toHaveLength(0);
    expect(vista.text()).toContain('Tomás (Tomi)');
    expect(vista.text()).toContain('Admin');
  });

  it('agrupa por rol: el Admin primero y después los viajeros, cada uno con su inicial', () => {
    const vista = mount(ListaParticipantes, {
      props: { participantes, soyAdmin: false, miId: 'tomas' },
    });
    expect(vista.findAll('.grupo-rol__titulo').map((t) => t.text())).toEqual([
      'Admin',
      'Viajeros (1)',
    ]);
    const [admin, viajeros] = vista.findAll('.grupo-rol');
    expect(admin!.text()).toContain('Ana');
    expect(viajeros!.text()).toContain('Tomás (Tomi)');
    expect(viajeros!.find('.inicial-persona').text()).toBe('T');
  });
});
