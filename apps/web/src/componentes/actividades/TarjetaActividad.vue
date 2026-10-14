<script setup lang="ts">
import type { AccionSobrePropuesta, ActividadVista, Moneda, ValorVoto } from '@viajes/compartido';
import IconoLinea from '../base/IconoLinea.vue';
import TarjetaPropuesta from '../propuestas/TarjetaPropuesta.vue';
import { formatearDuracion, formatearHorario } from '../../utiles/formato';

const props = defineProps<{
  actividad: ActividadVista;
  soyAdmin: boolean;
  moneda: Moneda;
  viajeId: string;
  /** Si se muestra la referencia a la original (cuando la alternativa aparece fuera de su grupo). */
  mostrarOriginal?: boolean;
  ocupada?: boolean;
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
    :ocupada="ocupada"
    :moneda="moneda"
    @votar="emit('votar', id, $event)"
    @desvotar="emit('desvotar', id)"
    @resolver="emit('resolver', id, $event)"
  >
    <p class="horario">
      <IconoLinea nombre="reloj" :tamano="16" /> {{ formatearHorario(actividad.actividad) }} ({{
        formatearDuracion(actividad.actividad.duracionMin)
      }})
    </p>
    <p v-if="mostrarOriginal && actividad.actividad.alternativaDe" class="original">
      Alternativa de «{{ actividad.actividad.alternativaDe.titulo }}»
    </p>
    <RouterLink
      v-if="actividad.estado === 'PENDIENTE'"
      class="proponer-alternativa boton boton--chico"
      :to="`/viajes/${viajeId}/actividades/${id}/alternativa`"
    >
      <span aria-hidden="true">＋</span> Proponer alternativa
    </RouterLink>
  </TarjetaPropuesta>
</template>

<style scoped>
.horario,
.original {
  margin: 0 0 var(--esp-2);
}
.original {
  font-style: italic;
  color: var(--color-texto-secundario);
}
.proponer-alternativa {
  margin-bottom: var(--esp-2);
}
</style>
