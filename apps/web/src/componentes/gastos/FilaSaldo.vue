<script setup lang="ts">
import type { DeudaVista, Moneda } from '@viajes/compartido';
import { formatearMonto, nombreVisible } from '../../utiles/formato';

defineProps<{ deuda: DeudaVista; moneda: Moneda; miId: string }>();
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR');
</script>

<template>
  <li class="fila-saldo">
    <span>{{ nombreVisible(deuda.contraparte) }}</span>
    <strong>{{ formatearMonto(deuda.monto, moneda) }}</strong>
    <small>actualizado el {{ fecha(deuda.ultimaActualizacion) }}</small>
    <!-- RN-P6: el historial de pagos se ve desde los dos lados. -->
    <details v-if="deuda.pagos.length" class="pagos">
      <summary>Pagos ({{ deuda.pagos.length }})</summary>
      <ul>
        <li v-for="p in deuda.pagos" :key="p.id">
          {{ fecha(p.fecha) }} · {{ formatearMonto(p.monto, moneda) }} · registrado por
          {{ p.registradoPor.id === miId ? 'vos' : nombreVisible(p.registradoPor) }}
        </li>
      </ul>
    </details>
    <div class="acciones"><slot /></div>
  </li>
</template>

<style scoped>
.fila-saldo {
  display: grid;
  grid-template-columns: 1fr auto;
  border-bottom: 1px solid var(--color-borde);
  padding: 0.5rem 0;
  gap: 0.2rem;
}
small,
.pagos,
.acciones {
  grid-column: 1 / -1;
}
small {
  color: #57606a;
}
.pagos ul {
  margin: 0.3rem 0 0;
  padding-left: 1.2rem;
  font-size: 0.9rem;
}
.acciones:empty {
  display: none;
}
</style>
