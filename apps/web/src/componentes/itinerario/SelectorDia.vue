<script setup lang="ts">
import { nombreDelDia } from '../../utiles/fechas';

/** RN-M7: elige el día del mapa; resalta los que tienen actividades confirmadas. */
defineProps<{ dias: string[]; diasConActividad: string[]; seleccionado: string | null }>();
const emit = defineEmits<{ elegir: [dia: string] }>();
</script>

<template>
  <nav class="selector-dia" aria-label="Días del viaje">
    <button
      v-for="d in dias"
      :key="d"
      type="button"
      class="boton"
      :class="{ 'con-actividad': diasConActividad.includes(d) }"
      :aria-pressed="d === seleccionado"
      @click="emit('elegir', d)"
    >
      {{ nombreDelDia(d) }}
    </button>
  </nav>
</template>

<style scoped>
.selector-dia {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.con-actividad {
  border-color: var(--color-acento);
}
.boton[aria-pressed='true'] {
  background: var(--color-acento);
  color: #fff;
}
</style>
