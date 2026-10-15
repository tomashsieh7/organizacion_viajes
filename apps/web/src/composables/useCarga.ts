import { computed, ref } from 'vue';
import { mensajeDeError, sePuedeReintentar } from '../clientes/http';

/**
 * Carga de los datos de una pantalla. Mientras carga, `cargado` es falso; si falla, `error` tiene
 * el mensaje y `reintentar` vuelve a cargar, pero solo cuando falló la conexión o el servidor: ante
 * un rechazo de la API (por ejemplo, "No participás de este viaje") reintentar no cambia nada.
 */
export function useCarga(cargarDatos: () => Promise<unknown>) {
  const cargado = ref(false);
  const error = ref('');
  const reintentable = ref(false);

  async function cargar() {
    cargado.value = false;
    error.value = '';
    reintentable.value = false;
    try {
      await cargarDatos();
    } catch (e) {
      error.value = mensajeDeError(e);
      reintentable.value = sePuedeReintentar(e);
    } finally {
      cargado.value = true;
    }
  }

  const reintentar = computed(() => (reintentable.value ? cargar : undefined));
  return { cargado, error, cargar, reintentar };
}
