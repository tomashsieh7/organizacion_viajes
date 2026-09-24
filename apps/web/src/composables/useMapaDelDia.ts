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

  /** RN-M1 y RN-M7: sin día, la API decide cuál mostrar con la fecha del dispositivo. */
  async function cargar(dia?: string) {
    error.value = '';
    cargando.value = true;
    try {
      mapa.value = await itinerario!.mapa(viajeId(), hoyDelDispositivo(), dia);
      if (elegida.value && elegida.value.actividad.fecha !== mapa.value.dia) elegida.value = null;
    } catch (e) {
      error.value = mensajeDeError(e);
    } finally {
      cargando.value = false;
    }
  }

  function elegir(id: string) {
    const actividad = mapa.value?.actividades.find((a) => a.id === id);
    elegida.value = actividad ? { actividad, confirmada: true } : null;
  }

  /** RN-M8: abre el día de la actividad y muestra su detalle. */
  async function abrirActividad(id: string) {
    error.value = '';
    try {
      const vista = await propuestas!.obtenerActividad(viajeId(), id);
      await cargar(vista.actividad.fecha);
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
      error.value = mensajeDeError(e);
    }
  }

  return { mapa, elegida, error, cargando, cargar, elegir, abrirActividad };
}
