<script setup lang="ts">
import { ref } from 'vue';
import type { AccionSobrePropuesta, ActividadVista, Moneda, ValorVoto } from '@viajes/compartido';
import IconoLinea from '../base/IconoLinea.vue';
import TarjetaActividad from './TarjetaActividad.vue';
import { ICONOS_ESTADO, NOMBRES_ESTADO } from '../../utiles/formato';

/**
 * Una propuesta de actividad como renglón de la lista del día: hora, título, votos y estado.
 * Tocarlo abre debajo la tarjeta completa para votar, resolver o proponer una alternativa. Las
 * alternativas van debajo de su original (P9), con sangría y una «o» delante del título.
 */
const props = defineProps<{
  actividad: ActividadVista;
  /** Si se muestra debajo de su original. */
  alternativa?: boolean;
  soyAdmin: boolean;
  moneda: Moneda;
  viajeId: string;
  ocupada?: boolean;
}>();
const emit = defineEmits<{
  votar: [id: string, valor: ValorVoto];
  desvotar: [id: string];
  resolver: [id: string, accion: AccionSobrePropuesta];
}>();
const abierta = ref(false);
const detalle = `detalle-${props.actividad.id}`;
</script>

<template>
  <li class="renglon" :class="{ 'renglon--alternativa': alternativa }">
    <button
      type="button"
      class="renglon__fila"
      :aria-expanded="abierta"
      :aria-controls="detalle"
      @click="abierta = !abierta"
    >
      <span class="renglon__hora">{{ actividad.actividad.horaInicio }}</span>
      <span class="renglon__titulo">
        <span v-if="alternativa" class="renglon__o">o </span>{{ actividad.actividad.titulo }}
      </span>
      <span class="renglon__votos">
        <span aria-hidden="true"
          >Sí {{ actividad.votosAFavor }} · No {{ actividad.votosEnContra }}</span
        >
        <span class="solo-lectores"
          >{{ actividad.votosAFavor }} a favor y {{ actividad.votosEnContra }} en contra</span
        >
      </span>
      <span class="insignia estado" :class="`insignia--${actividad.estado}`">
        <IconoLinea :nombre="ICONOS_ESTADO[actividad.estado]" :tamano="14" />
        {{ NOMBRES_ESTADO[actividad.estado] }}
      </span>
    </button>
    <div v-if="abierta" :id="detalle" class="renglon__detalle">
      <TarjetaActividad
        :actividad="actividad"
        :soy-admin="soyAdmin"
        :moneda="moneda"
        :viaje-id="viajeId"
        :ocupada="ocupada"
        :mostrar-original="!alternativa"
        @votar="(id, valor) => emit('votar', id, valor)"
        @desvotar="(id) => emit('desvotar', id)"
        @resolver="(id, accion) => emit('resolver', id, accion)"
      />
    </div>
  </li>
</template>

<style scoped>
.renglon + .renglon {
  border-top: 1px solid var(--color-borde);
}
.renglon__fila {
  display: grid;
  grid-template-columns: 3.25rem minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--esp-3);
  width: 100%;
  min-height: 3rem;
  padding: var(--esp-2) var(--esp-4);
  border: 0;
  background: none;
  color: var(--color-texto);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.renglon__fila:hover {
  background: var(--color-superficie-alt);
}
.renglon__fila[aria-expanded='true'] {
  background: var(--color-superficie-alt);
}
.renglon--alternativa .renglon__fila {
  padding-left: var(--esp-6);
  color: var(--color-texto-secundario);
}
.renglon__hora {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.renglon__titulo {
  font-weight: 600;
}
.renglon__o {
  font-style: italic;
}
.renglon__votos {
  font-size: 0.875rem;
  color: var(--color-texto-secundario);
  white-space: nowrap;
}
.renglon__detalle {
  padding: 0 var(--esp-2) var(--esp-2);
}
/* En celular los votos se ven al abrir la tarjeta; el renglón queda con hora, título y estado. */
@media (max-width: 47.99rem) {
  .renglon__fila {
    grid-template-columns: 3rem minmax(0, 1fr) auto;
  }
  .renglon__votos {
    display: none;
  }
}
</style>
