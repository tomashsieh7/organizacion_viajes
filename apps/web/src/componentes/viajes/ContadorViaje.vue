<script setup lang="ts">
import { computed } from 'vue';
import type { ResumenPlanificacion } from '@viajes/compartido';
import IconoLinea from '../base/IconoLinea.vue';
import { estadoContador } from '../../utiles/contador';
import { hoyDelDispositivo } from '../../utiles/fechas';

const props = defineProps<{
  inicio: string;
  fin: string;
  planificacion?: ResumenPlanificacion | null;
  hoy?: string;
}>();
const estado = computed(() =>
  estadoContador(props.inicio, props.fin, props.hoy ?? hoyDelDispositivo(), props.planificacion),
);
</script>

<template>
  <span class="contador" :data-tono="estado.tono">
    <span class="contador__cuenta"
      ><IconoLinea nombre="reloj" :tamano="18" /> {{ estado.texto }}</span
    >
    <span v-if="estado.detalle" class="contador__detalle">{{ estado.detalle }}</span>
  </span>
</template>

<style scoped>
.contador {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--esp-1);
  max-width: 100%;
  margin-block: var(--esp-1) var(--esp-3);
  --fondo: var(--color-neutro-suave);
  --tinta: var(--color-neutro);
}
.contador__cuenta {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-2);
  padding: var(--esp-2) var(--esp-3);
  border-radius: 999px;
  background: var(--fondo);
  color: var(--tinta);
  font-weight: 700;
  line-height: 1.4;
}
.contador__cuenta :deep(svg) {
  flex-shrink: 0;
}
.contador__detalle {
  font-size: 0.8125rem;
  color: var(--color-texto-secundario);
  overflow-wrap: anywhere;
}
.contador[data-tono='listo'] {
  --fondo: var(--color-exito-suave);
  --tinta: var(--color-exito);
}
/* Siete pasos de amarillo a rojo. Tintas oscuras sobre fondos suaves en ambos temas. */
.contador[data-tono='urgencia-0'] {
  --fondo: #fef9c3;
  --tinta: #713f12;
}
.contador[data-tono='urgencia-1'] {
  --fondo: #fef0c3;
  --tinta: #783c12;
}
.contador[data-tono='urgencia-2'] {
  --fondo: #ffe6c7;
  --tinta: #803411;
}
.contador[data-tono='urgencia-3'] {
  --fondo: #ffddcc;
  --tinta: #873016;
}
.contador[data-tono='urgencia-4'] {
  --fondo: #ffd4ce;
  --tinta: #8c2520;
}
.contador[data-tono='urgencia-5'] {
  --fondo: #ffcbce;
  --tinta: #921d2a;
}
.contador[data-tono='urgencia-6'] {
  --fondo: #ffc0c9;
  --tinta: #9f1239;
}
</style>
