<script setup lang="ts">
import type { AccionSobrePropuesta, ActividadVista, Moneda, ValorVoto } from '@viajes/compartido';
import TarjetaActividad from './TarjetaActividad.vue';

/** Alternativas de una actividad, anidadas debajo de la original (P9). */
defineProps<{
  alternativas: ActividadVista[];
  soyAdmin: boolean;
  moneda: Moneda;
  viajeId: string;
}>();
const emit = defineEmits<{
  votar: [id: string, valor: ValorVoto];
  desvotar: [id: string];
  resolver: [id: string, accion: AccionSobrePropuesta];
}>();
</script>

<template>
  <section class="alternativas" :aria-label="`${alternativas.length} alternativas`">
    <h4>Alternativas</h4>
    <TarjetaActividad
      v-for="a in alternativas"
      :key="a.id"
      :actividad="a"
      :soy-admin="soyAdmin"
      :moneda="moneda"
      :viaje-id="viajeId"
      @votar="(id, valor) => emit('votar', id, valor)"
      @desvotar="(id) => emit('desvotar', id)"
      @resolver="(id, accion) => emit('resolver', id, accion)"
    />
  </section>
</template>

<style scoped>
.alternativas {
  margin: -0.25rem 0 0.75rem 1.5rem;
  padding-left: 0.75rem;
  border-left: 3px solid var(--color-borde);
}
h4 {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
}
</style>
