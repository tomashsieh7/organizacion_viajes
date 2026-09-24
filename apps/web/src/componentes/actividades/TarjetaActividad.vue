<script setup lang="ts">
import type { AccionSobrePropuesta, ActividadVista, Moneda, ValorVoto } from '@viajes/compartido';
import TarjetaPropuesta from '../propuestas/TarjetaPropuesta.vue';
import { formatearDuracion, formatearHorario } from '../../utiles/formato';

const props = defineProps<{
  actividad: ActividadVista;
  soyAdmin: boolean;
  moneda: Moneda;
  viajeId: string;
  /** Si se muestra la referencia a la original (cuando la alternativa aparece fuera de su grupo). */
  mostrarOriginal?: boolean;
}>();
const emit = defineEmits<{
  votar: [id: string, valor: ValorVoto];
  desvotar: [id: string];
  resolver: [id: string, accion: AccionSobrePropuesta];
}>();
const id = props.actividad.id;
</script>

<template>
  <TarjetaPropuesta
    :propuesta="actividad"
    :titulo="actividad.actividad.titulo"
    :soy-admin="soyAdmin"
    :moneda="moneda"
    @votar="emit('votar', id, $event)"
    @desvotar="emit('desvotar', id)"
    @resolver="emit('resolver', id, $event)"
  >
    <p class="horario">
      {{ formatearHorario(actividad.actividad) }} ({{
        formatearDuracion(actividad.actividad.duracionMin)
      }})
    </p>
    <p v-if="mostrarOriginal && actividad.actividad.alternativaDe" class="original">
      Alternativa de «{{ actividad.actividad.alternativaDe.titulo }}»
    </p>
    <RouterLink
      v-if="actividad.estado === 'PENDIENTE'"
      class="proponer-alternativa"
      :to="`/viajes/${viajeId}/actividades/${id}/alternativa`"
    >
      Proponer alternativa
    </RouterLink>
  </TarjetaPropuesta>
</template>

<style scoped>
.horario,
.original {
  margin: 0.25rem 0 0;
}
.original {
  font-style: italic;
}
.proponer-alternativa {
  display: inline-block;
  margin-top: 0.25rem;
}
</style>
