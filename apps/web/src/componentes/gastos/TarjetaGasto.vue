<script setup lang="ts">
import type { GastoVista, Moneda } from '@viajes/compartido';
import { formatearMonto, nombreVisible } from '../../utiles/formato';

const props = defineProps<{ gasto: GastoVista; moneda: Moneda; miId: string }>();
const quien = (p: { id: string; nombre: string; apodo: string | null }) =>
  p.id === props.miId ? 'vos' : nombreVisible(p);
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR');
</script>

<template>
  <article class="gasto">
    <header>
      <h3>{{ gasto.titulo }}</h3>
      <strong class="monto">{{ formatearMonto(gasto.monto, moneda) }}</strong>
    </header>
    <p class="meta">
      {{ gasto.categoria.nombre }} · pagó {{ quien(gasto.pagadoPor) }} ·
      {{ gasto.modoDivision === 'IGUALES' ? 'en partes iguales' : 'división indicada' }} ·
      {{ fecha(gasto.creadoEn) }}
    </p>
    <ul class="partes">
      <li v-for="p in gasto.partes" :key="p.usuario.id">
        {{ quien(p.usuario) }}: {{ formatearMonto(p.monto, moneda) }}
      </li>
    </ul>
  </article>
</template>

<style scoped>
.gasto {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  box-shadow: var(--sombra);
  padding: var(--esp-4);
  margin-bottom: var(--esp-3);
}
header {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
h3 {
  margin: 0;
}
.meta {
  color: var(--color-texto-secundario);
  font-size: 0.9375rem;
  margin: var(--esp-1) 0 var(--esp-2);
}
.partes {
  margin: 0;
  padding-left: 1.2rem;
}
</style>
