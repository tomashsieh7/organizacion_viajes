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
      <strong>{{ formatearMonto(gasto.monto, moneda) }}</strong>
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
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
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
  color: #57606a;
  font-size: 0.9rem;
  margin: 0.3rem 0;
}
.partes {
  margin: 0;
  padding-left: 1.2rem;
}
</style>
