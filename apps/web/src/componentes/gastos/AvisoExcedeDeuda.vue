<script setup lang="ts">
import type { Moneda } from '@viajes/compartido';
import { formatearMonto } from '../../utiles/formato';

/** RN-P4: el monto supera lo que se debe; se muestra el saldo para corregirlo. */
defineProps<{ saldo: number; moneda: Moneda }>();
</script>

<template>
  <p class="aviso-excede" role="alert">
    El monto supera lo que debés. El saldo pendiente es {{ formatearMonto(saldo, moneda) }}.
  </p>
</template>

<style scoped>
.aviso-excede {
  color: var(--color-error);
  margin: 0 0 0.75rem;
}
</style>
