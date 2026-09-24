<script setup lang="ts">
import { computed } from 'vue';
import type { AccionSobrePropuesta, Moneda, PropuestaVista, ValorVoto } from '@viajes/compartido';
import { formatearMonto, NOMBRES_ESTADO } from '../../utiles/formato';

const props = defineProps<{
  propuesta: PropuestaVista;
  soyAdmin: boolean;
  moneda: Moneda;
  titulo: string;
}>();
const emit = defineEmits<{
  votar: [valor: ValorVoto];
  desvotar: [];
  resolver: [accion: AccionSobrePropuesta];
}>();

const pendiente = computed(() => props.propuesta.estado === 'PENDIENTE');
/** Acciones del Admin según el estado (RN-R1). */
const accionesAdmin = computed<{ accion: AccionSobrePropuesta; texto: string }[]>(() => {
  if (!props.soyAdmin) return [];
  if (props.propuesta.estado === 'PENDIENTE') {
    return [
      { accion: 'confirmar', texto: 'Confirmar' },
      { accion: 'denegar', texto: 'Denegar' },
    ];
  }
  return props.propuesta.estado === 'CONFIRMADA' ? [{ accion: 'cancelar', texto: 'Cancelar' }] : [];
});
</script>

<template>
  <article class="propuesta" :data-estado="propuesta.estado">
    <header>
      <h3>{{ titulo }}</h3>
      <span class="estado">{{ NOMBRES_ESTADO[propuesta.estado] }}</span>
    </header>
    <slot />
    <p>{{ propuesta.descripcion }}</p>
    <p class="meta">
      {{ propuesta.ubicacion }}
      <template v-if="propuesta.precio !== null">
        · {{ formatearMonto(propuesta.precio, moneda) }}</template
      >
      · propuesta por {{ propuesta.autor.nombre }}
    </p>
    <footer>
      <span class="conteo" aria-label="Votos"
        >👍 {{ propuesta.votosAFavor }} · 👎 {{ propuesta.votosEnContra }}</span
      >
      <div v-if="pendiente" class="votos">
        <button
          type="button"
          class="boton"
          :aria-pressed="propuesta.miVoto === 'A_FAVOR'"
          @click="emit('votar', 'A_FAVOR')"
        >
          A favor
        </button>
        <button
          type="button"
          class="boton"
          :aria-pressed="propuesta.miVoto === 'EN_CONTRA'"
          @click="emit('votar', 'EN_CONTRA')"
        >
          En contra
        </button>
        <button v-if="propuesta.miVoto" type="button" class="boton" @click="emit('desvotar')">
          Retirar voto
        </button>
      </div>
      <div v-if="accionesAdmin.length" class="admin">
        <button
          v-for="a in accionesAdmin"
          :key="a.accion"
          type="button"
          class="boton"
          :class="a.accion === 'confirmar' ? 'boton--principal' : 'boton--peligro'"
          @click="emit('resolver', a.accion)"
        >
          {{ a.texto }}
        </button>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.propuesta {
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  padding: 1rem;
  margin-bottom: 0.75rem;
}
.propuesta[data-estado='CONFIRMADA'] {
  border-color: var(--color-exito);
}
.propuesta[data-estado='DENEGADA'],
.propuesta[data-estado='CANCELADA'] {
  opacity: 0.7;
}
header {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
h3 {
  margin: 0;
}
.estado {
  font-size: 0.85rem;
}
.meta {
  color: #57606a;
  font-size: 0.9rem;
}
footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
}
.votos,
.admin {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.boton[aria-pressed='true'] {
  background: var(--color-superficie);
  border-color: var(--color-acento);
  font-weight: bold;
}
</style>
