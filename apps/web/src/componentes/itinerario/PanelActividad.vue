<script setup lang="ts">
import type { ActividadDelItinerario } from '@viajes/compartido';
import { formatearDuracion, formatearHorario } from '../../utiles/formato';

defineProps<{ actividad: ActividadDelItinerario; numero: number | null; confirmada: boolean }>();
const emit = defineEmits<{ cerrar: [] }>();
</script>

<template>
  <aside class="panel-actividad" :aria-label="`Detalle de ${actividad.titulo}`">
    <header>
      <h3>
        <span v-if="numero !== null" class="numero">{{ numero }}</span> {{ actividad.titulo }}
      </h3>
      <button type="button" class="boton" aria-label="Cerrar detalle" @click="emit('cerrar')">
        ✕
      </button>
    </header>
    <p>{{ formatearHorario(actividad) }} ({{ formatearDuracion(actividad.duracionMin) }})</p>
    <p>{{ actividad.ubicacion }}</p>
    <p>{{ actividad.descripcion }}</p>
    <p v-if="!confirmada" class="nota">
      Esta actividad no está confirmada, por eso no aparece en el recorrido del día.
    </p>
  </aside>
</template>

<style scoped>
.panel-actividad {
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  padding: 0.75rem 1rem;
  margin-top: 0.75rem;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: start;
}
h3 {
  margin: 0;
}
p {
  margin: 0.3rem 0;
}
.numero {
  display: inline-grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: var(--color-acento);
  color: #fff;
  font-size: 0.9rem;
}
.nota {
  font-style: italic;
}
</style>
