<script setup lang="ts">
import type { DeudaVista, Moneda } from '@viajes/compartido';
import { formatearMonto, nombreVisible } from '../../utiles/formato';

defineProps<{
  deuda: DeudaVista;
  moneda: Moneda;
  miId: string;
  /** Desde qué lado se mira la deuda: cambia la frase y el color del monto. */
  sentido?: 'debo' | 'meDeben';
}>();
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR');
</script>

<template>
  <li class="fila-saldo panel">
    <span class="nombre">{{ nombreVisible(deuda.contraparte) }}</span>
    <span class="importe" :class="sentido">
      <small v-if="sentido" class="frase">{{ sentido === 'debo' ? 'Le debés' : 'Te debe' }}</small>
      <strong class="monto">{{ formatearMonto(deuda.monto, moneda) }}</strong>
    </span>
    <small class="actualizado">Actualizado el {{ fecha(deuda.ultimaActualizacion) }}</small>
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
  align-items: center;
  gap: var(--esp-1) var(--esp-3);
  margin-bottom: var(--esp-3);
}
.nombre {
  font-weight: 600;
}
.importe {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}
.importe strong {
  font-size: 1.125rem;
}
.importe.debo strong {
  color: var(--color-error);
}
.importe.meDeben strong {
  color: var(--color-exito);
}
.frase,
.actualizado {
  color: var(--color-texto-secundario);
}
.actualizado,
.pagos,
.acciones {
  grid-column: 1 / -1;
}
.pagos summary {
  cursor: pointer;
  min-height: 2rem;
}
.pagos ul {
  margin: var(--esp-1) 0 0;
  padding-left: var(--esp-5);
  font-size: 0.9375rem;
}
.acciones {
  display: flex;
  justify-content: flex-end;
}
.acciones:empty {
  display: none;
}
</style>
