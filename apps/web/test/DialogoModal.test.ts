import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import DialogoModal from '../src/componentes/base/DialogoModal.vue';

describe('DialogoModal', () => {
  it('toma el foco al abrirse, se cierra con Escape y devuelve el foco al cerrarse', async () => {
    const boton = document.createElement('button');
    document.body.append(boton);
    boton.focus();

    const dialogo = mount(DialogoModal, {
      props: { titulo: 'Nuevo grupo' },
      attachTo: document.body,
    });
    expect(document.activeElement).toBe(dialogo.find('[role="dialog"]').element);

    await dialogo.find('[role="dialog"]').trigger('keydown', { key: 'Escape' });
    expect(dialogo.emitted('cerrar')).toHaveLength(1);

    dialogo.unmount();
    expect(document.activeElement).toBe(boton);
    boton.remove();
  });

  it('Escape lo cierra aunque el foco haya quedado fuera del diálogo', () => {
    const cerrar = vi.fn();
    const dialogo = mount(DialogoModal, {
      props: { titulo: 'Nuevo grupo', onCerrar: cerrar },
      attachTo: document.body,
    });
    // Como cuando un botón del diálogo se deshabilita y el navegador le saca el foco.
    (document.activeElement as HTMLElement).blur();
    const escape = () =>
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    escape();
    expect(cerrar).toHaveBeenCalledTimes(1);
    dialogo.unmount();
    // Cerrado, Escape ya no hace nada.
    escape();
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('Tab y Mayús + Tab dan la vuelta dentro del diálogo, sin pasar a la página de atrás', () => {
    const afuera = document.createElement('button');
    document.body.append(afuera);
    const dialogo = mount(DialogoModal, {
      props: { titulo: 'Nuevo grupo' },
      slots: {
        default:
          '<input id="primero" /><button id="deshabilitado" disabled>No</button><button id="ultimo">Sí</button>',
      },
      attachTo: document.body,
    });
    const tab = (shiftKey = false) => {
      const evento = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      document.activeElement!.dispatchEvent(evento);
      return evento.defaultPrevented;
    };
    const enfocado = () => document.activeElement?.id;

    // Entre controles, Tab sigue su curso normal: el navegador mueve el foco.
    (document.getElementById('primero') as HTMLElement).focus();
    expect(tab()).toBe(false);
    // Desde el último, Tab vuelve al primero; desde el primero, Mayús + Tab va al último.
    (document.getElementById('ultimo') as HTMLElement).focus();
    expect(tab()).toBe(true);
    expect(enfocado()).toBe('primero');
    expect(tab(true)).toBe(true);
    expect(enfocado()).toBe('ultimo');
    // Si el foco quedó afuera, Tab lo devuelve al diálogo.
    afuera.focus();
    expect(tab()).toBe(true);
    expect(enfocado()).toBe('primero');

    dialogo.unmount();
    afuera.remove();
  });
});
