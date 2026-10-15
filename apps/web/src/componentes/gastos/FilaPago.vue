<script setup lang="ts">
import { computed } from 'vue';
import type { Moneda, PagoDeActividad } from '@viajes/compartido';
import IconoLinea from '../base/IconoLinea.vue';
import { formatearHora, formatearMonto, nombreVisible } from '../../utiles/formato';

/** Un pago en la Actividad, con el mismo formato que un gasto pero sin nada para desplegar. */
const props = defineProps<{ pago: PagoDeActividad; moneda: Moneda; miId: string }>();
const pagueYo = computed(() => props.pago.deudor.id === props.miId);
</script>

<template>
  <article class="pago">
    <span class="pago__icono"><IconoLinea nombre="pagar" :tamano="20" /></span>
    <span class="pago__texto">
      <strong class="pago__titulo">{{
        pagueYo
          ? `Le pagaste a ${nombreVisible(pago.acreedor)}`
          : `${nombreVisible(pago.deudor)} te pagó`
      }}</strong>
      <span class="meta">Pago · {{ formatearHora(pago.fecha) }}</span>
    </span>
    <strong class="monto" :class="{ 'monto--recibido': !pagueYo }">
      {{ pagueYo ? '−' : '+' }} {{ formatearMonto(pago.monto, moneda) }}
    </strong>
  </article>
</template>

<style scoped>
.pago {
  display: flex;
  align-items: center;
  gap: var(--esp-3);
  padding: var(--esp-3) var(--esp-4);
}
.pago__icono {
  flex: none;
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-content: center;
  border-radius: 50%;
  background: var(--color-superficie-alt);
  color: var(--color-acento);
}
.pago__texto {
  flex: 1;
  min-width: 0;
}
.pago__titulo,
.meta {
  display: block;
}
.meta {
  color: var(--color-texto-secundario);
  font-size: 0.875rem;
}
.monto {
  white-space: nowrap;
}
.monto--recibido {
  color: var(--color-exito);
}
</style>
