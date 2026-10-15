<script setup lang="ts">
import { computed } from 'vue';
import type { GastoVista, Moneda } from '@viajes/compartido';
import IconoLinea, { type NombreIcono } from '../base/IconoLinea.vue';
import { formatearMonto, nombreVisible } from '../../utiles/formato';

/**
 * Un gasto como movimiento de una billetera: ícono de su categoría, título, quién pagó y cuánto te
 * toca; el reparto completo se despliega al tocarlo.
 */
const props = defineProps<{ gasto: GastoVista; moneda: Moneda; miId: string }>();

const ICONOS: Record<string, NombreIcono> = {
  ALOJAMIENTO: 'cama',
  TRANSPORTE: 'transporte',
  COMIDA: 'comida',
  ACTIVIDADES: 'mapa',
  COMPRAS: 'compras',
};
const icono = computed(() => ICONOS[props.gasto.categoria.codigo] ?? 'cuentas');
const quien = (p: { id: string; nombre: string; apodo: string | null }) =>
  p.id === props.miId ? 'vos' : nombreVisible(p);
const miParte = computed(() => props.gasto.partes.find((p) => p.usuario.id === props.miId));
const pagueYo = computed(() => props.gasto.pagadoPor.id === props.miId);
</script>

<template>
  <article class="gasto">
    <details>
      <summary>
        <span class="gasto__icono" :title="gasto.categoria.nombre"
          ><IconoLinea :nombre="icono" :tamano="20"
        /></span>
        <span class="gasto__texto">
          <strong class="gasto__titulo">{{ gasto.titulo }}</strong>
          <span class="meta">
            {{ pagueYo ? 'Pagaste vos' : `Pagó ${quien(gasto.pagadoPor)}` }} ·
            <template v-if="miParte">tu parte {{ formatearMonto(miParte.monto, moneda) }}</template>
            <template v-else>no participás</template>
          </span>
        </span>
        <strong class="monto">{{ formatearMonto(gasto.monto, moneda) }}</strong>
      </summary>
      <div class="detalle">
        <p class="meta">
          {{ gasto.categoria.nombre }} ·
          {{ gasto.modoDivision === 'IGUALES' ? 'en partes iguales' : 'división indicada' }}
        </p>
        <ul class="partes">
          <li v-for="p in gasto.partes" :key="p.usuario.id">
            {{ quien(p.usuario) }}: {{ formatearMonto(p.monto, moneda) }}
          </li>
        </ul>
      </div>
    </details>
  </article>
</template>

<style scoped>
summary {
  display: flex;
  align-items: center;
  gap: var(--esp-3);
  padding: var(--esp-3) var(--esp-4);
  cursor: pointer;
  list-style: none;
}
summary::-webkit-details-marker {
  display: none;
}
.gasto__icono {
  flex: none;
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-content: center;
  border-radius: 50%;
  background: var(--color-superficie-alt);
  color: var(--color-acento);
}
.gasto__texto {
  flex: 1;
  min-width: 0;
}
.gasto__titulo,
.gasto__texto .meta {
  display: block;
}
.meta {
  color: var(--color-texto-secundario);
  font-size: 0.875rem;
  margin: 0;
}
.monto {
  white-space: nowrap;
}
.detalle {
  padding: 0 var(--esp-4) var(--esp-3) calc(2.5rem + var(--esp-3) + var(--esp-4));
}
.partes {
  margin: var(--esp-1) 0 0;
  padding-left: 1.2rem;
}
</style>
