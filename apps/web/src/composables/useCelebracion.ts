import { readonly, ref } from 'vue';

/** La celebración visible: una sola a la vez, la última reemplaza a la anterior. */
const actual = ref<{ id: number; mensaje: string } | null>(null);
let siguienteId = 0;
let temporizador: ReturnType<typeof setTimeout> | undefined;

/** Cuánto dura en pantalla; alcanza para leer el mensaje sin que estorbe. */
export const DURACION_CELEBRACION_MS = 4500;

/**
 * Celebraciones de logros del viaje (gamificación, PLAN 7.1.1): un mensaje breve con una lluvia de
 * emojis. El estado es compartido, así cualquier vista celebra y `App.vue` lo muestra.
 */
export function useCelebracion() {
  function celebrar(mensaje: string) {
    actual.value = { id: ++siguienteId, mensaje };
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (actual.value = null), DURACION_CELEBRACION_MS);
  }

  function cerrar() {
    clearTimeout(temporizador);
    actual.value = null;
  }

  return { celebracion: readonly(actual), celebrar, cerrar };
}
