<script setup lang="ts">
import { computed } from 'vue';

/** `compacto`: versión chica para una tarjeta de resumen, solo con el porcentaje. */
const props = defineProps<{ porcentaje: number; compacto?: boolean }>();
const RADIO = 50;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const desfase = computed(() => CIRCUNFERENCIA * (1 - props.porcentaje / 100));
</script>

<template>
  <div
    class="anillo"
    :class="{ 'anillo--compacto': compacto }"
    role="progressbar"
    aria-label="Progreso del viaje"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="porcentaje"
  >
    <svg width="100%" height="100%" viewBox="0 0 120 120" aria-hidden="true">
      <circle class="anillo__fondo" cx="60" cy="60" :r="RADIO" />
      <circle
        class="anillo__avance"
        cx="60"
        cy="60"
        :r="RADIO"
        :stroke-dasharray="CIRCUNFERENCIA"
        :stroke-dashoffset="desfase"
      />
    </svg>
    <span class="anillo__texto" aria-hidden="true"
      ><strong>{{ porcentaje }}%</strong><span v-if="!compacto">listo</span></span
    >
  </div>
</template>

<style scoped>
.anillo {
  position: relative;
  width: 120px;
  height: 120px;
  flex: none;
}
svg {
  transform: rotate(-90deg);
}
circle {
  fill: none;
  stroke-width: 12;
}
.anillo__fondo {
  stroke: var(--color-borde);
}
.anillo__avance {
  stroke: var(--color-acento);
  stroke-linecap: round;
  transition: stroke-dashoffset 600ms ease-out;
}
.anillo__texto {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
  font-family: var(--fuente-titulos);
}
.anillo__texto strong {
  font-size: 1.9rem;
  line-height: 1;
}
.anillo--compacto {
  width: 76px;
  height: 76px;
}
.anillo--compacto .anillo__texto strong {
  font-size: 1.2rem;
}
.anillo__texto span {
  font-size: 0.8rem;
  color: var(--color-texto-secundario);
}
</style>
