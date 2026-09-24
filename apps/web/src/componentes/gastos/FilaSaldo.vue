<script setup lang="ts">
import type { DeudaVista, Moneda } from '@viajes/compartido';
import { formatearMonto, nombreVisible } from '../../utiles/formato';

defineProps<{ deuda: DeudaVista; moneda: Moneda }>();
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR');
</script>

<template>
  <li class="fila-saldo">
    <span>{{ nombreVisible(deuda.contraparte) }}</span>
    <strong>{{ formatearMonto(deuda.monto, moneda) }}</strong>
    <small>actualizado el {{ fecha(deuda.ultimaActualizacion) }}</small>
  </li>
</template>

<style scoped>
.fila-saldo {
  display: grid;
  grid-template-columns: 1fr auto;
  border-bottom: 1px solid var(--color-borde);
  padding: 0.5rem 0;
}
small {
  color: #57606a;
  grid-column: 1 / -1;
}
</style>
