<script setup lang="ts">
import { computed } from 'vue';
import {
  repartirEnPartesIguales,
  type ModoDivision,
  type Moneda,
  type Participante,
} from '@viajes/compartido';
import { aUnidadMinima, formatearMonto, nombreVisible } from '../../utiles/formato';

/**
 * RN-G4: muestra cómo queda la división. En partes iguales, con el mismo reparto que hace la API;
 * en arbitraria, un campo por deudor con la suma y la diferencia con el total mientras se escribe.
 */
const props = defineProps<{
  modo: ModoDivision;
  total: number | null;
  deudores: Participante[];
  moneda: Moneda;
}>();
const montos = defineModel<Record<string, string>>({ required: true });

const iguales = computed(() =>
  props.total && props.deudores.length
    ? repartirEnPartesIguales(props.total, props.deudores.length)
    : [],
);
const suma = computed(() =>
  props.deudores.reduce(
    (t, d) => t + (aUnidadMinima(montos.value[d.usuarioId] ?? '', props.moneda.decimales) ?? 0),
    0,
  ),
);
const diferencia = computed(() => (props.total ?? 0) - suma.value);
const monto = (m: number) => formatearMonto(m, props.moneda);

function escribir(usuarioId: string, texto: string) {
  montos.value = { ...montos.value, [usuarioId]: texto };
}
</script>

<template>
  <table v-if="deudores.length" class="tabla-partes">
    <tbody>
      <tr v-for="(d, i) in deudores" :key="d.usuarioId">
        <th scope="row">{{ nombreVisible(d) }}</th>
        <td v-if="modo === 'IGUALES'">{{ iguales[i] !== undefined ? monto(iguales[i]!) : '—' }}</td>
        <td v-else>
          <input
            :id="`parte-${d.usuarioId}`"
            :aria-label="`Monto de ${nombreVisible(d)}`"
            :value="montos[d.usuarioId] ?? ''"
            inputmode="decimal"
            placeholder="0"
            @input="escribir(d.usuarioId, ($event.target as HTMLInputElement).value)"
          />
        </td>
      </tr>
    </tbody>
    <tfoot v-if="modo === 'ARBITRARIA'">
      <tr>
        <th scope="row">Suma</th>
        <td>{{ monto(suma) }}</td>
      </tr>
      <tr class="diferencia" :data-cuadra="diferencia === 0">
        <th scope="row">{{ diferencia >= 0 ? 'Falta asignar' : 'Sobra' }}</th>
        <td>{{ monto(Math.abs(diferencia)) }}</td>
      </tr>
    </tfoot>
  </table>
</template>

<style scoped>
.tabla-partes {
  border-collapse: collapse;
  margin-bottom: 0.9rem;
}
th,
td {
  text-align: left;
  padding: 0.25rem 1rem 0.25rem 0;
}
th {
  font-weight: normal;
}
input {
  width: 9rem;
}
.diferencia[data-cuadra='false'] {
  color: var(--color-error);
}
.diferencia[data-cuadra='true'] {
  color: var(--color-exito);
}
</style>
