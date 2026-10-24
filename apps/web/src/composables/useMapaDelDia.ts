import { inject, ref } from 'vue';
import type { ActividadDelItinerario, MapaDelDia } from '@viajes/compartido';
import { CLIENTE_ITINERARIO } from '../clientes/itinerario';
import { CLIENTE_PROPUESTAS } from '../clientes/propuestas';
import { mensajeDeError } from '../clientes/http';
import { hoyDelDispositivo } from '../utiles/fechas';

/** Actividad elegida en el mapa; `confirmada` es falso si se abrió una que no está en el recorrido. */
export interface ActividadElegida {
  actividad: ActividadDelItinerario;
  confirmada: boolean;
}

/** Estado del mapa del día (CU17 y CU18). El mapa es de solo lectura, así que no usa store. */
export function useMapaDelDia(viajeId: () => string) {
  const itinerario = inject(CLIENTE_ITINERARIO);
  const propuestas = inject(CLIENTE_PROPUESTAS);
  if (!itinerario || !propuestas) throw new Error('Faltan inyectar los clientes del mapa');

  const mapa = ref<MapaDelDia | null>(null);
  const elegida = ref<ActividadElegida | null>(null);
  const error = ref('');
  const cargando = ref(false);

  /**
   * Número del último pedido: si el viajero cambia de día antes de que llegue la respuesta, la
   * anterior se descarta para que el mapa muestre siempre el último día elegido.
   */
  let ultimoPedido = 0;

  /**
   * RN-M1 y RN-M7: sin día, la API decide cuál mostrar con la fecha del dispositivo. Devuelve si
   * el mapa quedó cargado con esta respuesta.
   */
  async function cargar(dia?: string): Promise<boolean> {
    const pedido = ++ultimoPedido;
    error.value = '';
    cargando.value = true;
    try {
      const respuesta = await itinerario!.mapa(viajeId(), hoyDelDispositivo(), dia);
      if (pedido !== ultimoPedido) return false;
      mapa.value = respuesta;
      if (elegida.value && elegida.value.actividad.fecha !== respuesta.dia) elegida.value = null;
      return true;
    } catch (e) {
      if (pedido === ultimoPedido) error.value = mensajeDeError(e);
      return false;
    } finally {
      if (pedido === ultimoPedido) cargando.value = false;
    }
  }

  function elegir(id: string) {
    const actividad = mapa.value?.actividades.find((a) => a.id === id);
    elegida.value = actividad ? { actividad, confirmada: true } : null;
  }

  /** RN-M8: abre el día de la actividad y muestra su detalle. */
  async function abrirActividad(id: string) {
    const pedido = ++ultimoPedido;
    error.value = '';
    try {
      const vista = await propuestas!.obtenerActividad(viajeId(), id);
      if (vista.actividad.fecha === null) {
        elegida.value = null;
        error.value = 'Esta propuesta está sin día. Revisala en Planificar';
        return;
      }
      if (pedido !== ultimoPedido || !(await cargar(vista.actividad.fecha))) return;
      const enElMapa = mapa.value?.actividades.find((a) => a.id === id);
      elegida.value = enElMapa
        ? { actividad: enElMapa, confirmada: true }
        : {
            confirmada: false,
            actividad: {
              id: vista.id,
              titulo: vista.actividad.titulo,
              descripcion: vista.descripcion,
              fecha: vista.actividad.fecha,
              horaInicio: vista.actividad.horaInicio,
              horaFin: vista.actividad.horaFin,
              duracionMin: vista.actividad.duracionMin,
              ubicacion: vista.ubicacion,
              latitud: vista.latitud ?? 0,
              longitud: vista.longitud ?? 0,
            },
          };
    } catch (e) {
      if (pedido === ultimoPedido) error.value = mensajeDeError(e);
    }
  }

  return { mapa, elegida, error, cargando, cargar, elegir, abrirActividad };
}
