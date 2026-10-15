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
});
