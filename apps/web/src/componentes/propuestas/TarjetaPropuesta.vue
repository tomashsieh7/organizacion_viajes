<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AccionSobrePropuesta, Moneda, PropuestaVista, ValorVoto } from '@viajes/compartido';
import DialogoModal from '../base/DialogoModal.vue';
import IconoLinea, { type NombreIcono } from '../base/IconoLinea.vue';
import { formatearMonto, NOMBRES_ESTADO } from '../../utiles/formato';

const props = defineProps<{
  propuesta: PropuestaVista;
  soyAdmin: boolean;
  moneda: Moneda;
  titulo: string;
  /** Mientras se espera la respuesta de un voto o una resolución, los botones no responden. */
  ocupada?: boolean;
}>();
const emit = defineEmits<{
  votar: [valor: ValorVoto];
  desvotar: [];
  resolver: [accion: AccionSobrePropuesta];
}>();

const pendiente = computed(() => props.propuesta.estado === 'PENDIENTE');
/** Ícono de cada estado; acompaña al texto y al color de la insignia. */
const ICONO_ESTADO: Record<PropuestaVista['estado'], NombreIcono> = {
  PENDIENTE: 'reloj',
  CONFIRMADA: 'check',
  DENEGADA: 'cruz',
  CANCELADA: 'prohibido',
};
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

/**
 * Denegar y cancelar no tienen vuelta atrás (RN-R1), así que piden confirmación; confirmar no,
 * porque una propuesta confirmada todavía se puede cancelar.
 */
const aConfirmar = ref<'denegar' | 'cancelar' | null>(null);
const PREGUNTAS = {
  denegar: { titulo: 'Denegar propuesta', boton: 'Sí, denegar' },
  cancelar: { titulo: 'Cancelar propuesta', boton: 'Sí, cancelar' },
} as const;

function alTocar(accion: AccionSobrePropuesta) {
  if (accion === 'confirmar') emit('resolver', accion);
  else aConfirmar.value = accion;
}

function confirmarAccion() {
  const accion = aConfirmar.value;
  aConfirmar.value = null;
  if (accion) emit('resolver', accion);
}
</script>

<template>
  <article class="propuesta panel" :data-estado="propuesta.estado">
    <header>
      <h3>{{ titulo }}</h3>
      <span class="insignia estado" :class="`insignia--${propuesta.estado}`">
        <IconoLinea :nombre="ICONO_ESTADO[propuesta.estado]" :tamano="14" />
        {{ NOMBRES_ESTADO[propuesta.estado] }}
      </span>
    </header>
    <slot />
    <p class="descripcion">{{ propuesta.descripcion }}</p>
    <p class="meta">
      <IconoLinea nombre="pin" :tamano="16" /> {{ propuesta.ubicacion }}
      <template v-if="propuesta.precio !== null">
        · <span class="monto">{{ formatearMonto(propuesta.precio, moneda) }}</span></template
      >
      · propuesta por {{ propuesta.autor.nombre }}
    </p>
    <footer>
      <span class="conteo">
        <span class="conteo__votos" aria-hidden="true"
          ><IconoLinea nombre="a-favor" :tamano="16" /> {{ propuesta.votosAFavor }}
          <IconoLinea nombre="en-contra" :tamano="16" /> {{ propuesta.votosEnContra }}</span
        >
        <span class="solo-lectores"
          >Votos: {{ propuesta.votosAFavor }} a favor y {{ propuesta.votosEnContra }} en
          contra</span
        >
      </span>
      <div v-if="pendiente" class="votos">
        <button
          type="button"
          class="boton"
          :disabled="ocupada"
          :aria-pressed="propuesta.miVoto === 'A_FAVOR'"
          @click="emit('votar', 'A_FAVOR')"
        >
          A favor
        </button>
        <button
          type="button"
          class="boton"
          :disabled="ocupada"
          :aria-pressed="propuesta.miVoto === 'EN_CONTRA'"
          @click="emit('votar', 'EN_CONTRA')"
        >
          En contra
        </button>
        <button
          v-if="propuesta.miVoto"
          type="button"
          class="boton"
          :disabled="ocupada"
          @click="emit('desvotar')"
        >
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
          :disabled="ocupada"
          @click="alTocar(a.accion)"
        >
          {{ a.texto }}
        </button>
      </div>
    </footer>
    <DialogoModal
      v-if="aConfirmar"
      :titulo="PREGUNTAS[aConfirmar].titulo"
      @cerrar="aConfirmar = null"
    >
      <p>
        ¿{{ aConfirmar === 'denegar' ? 'Denegar' : 'Cancelar' }} «{{ titulo }}»? No se puede
        deshacer.
      </p>
      <div class="acciones">
        <button type="button" class="boton" @click="aConfirmar = null">Volver</button>
        <button type="button" class="boton boton--peligro" @click="confirmarAccion">
          {{ PREGUNTAS[aConfirmar].boton }}
        </button>
      </div>
    </DialogoModal>
  </article>
</template>

<style scoped>
/* Los saltos de línea de la descripción se muestran como se escribieron. */
.descripcion {
  white-space: pre-line;
}
.propuesta {
  border-left: 4px solid var(--color-aviso);
  margin-bottom: var(--esp-3);
}
.propuesta[data-estado='CONFIRMADA'] {
  border-left-color: var(--color-exito);
}
.propuesta[data-estado='DENEGADA'],
.propuesta[data-estado='CANCELADA'] {
  border-left-color: var(--color-borde-fuerte);
  background: var(--color-superficie-alt);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--esp-2);
  margin-bottom: var(--esp-1);
}
h3 {
  margin: 0;
}
.meta {
  color: var(--color-texto-secundario);
  font-size: 0.9375rem;
}
footer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-3);
  align-items: center;
  justify-content: space-between;
  padding-top: var(--esp-3);
  border-top: 1px solid var(--color-borde);
}
.conteo {
  font-variant-numeric: tabular-nums;
}
.votos,
.admin {
  display: flex;
  gap: var(--esp-2);
  flex-wrap: wrap;
}
/* El voto propio se distingue por el color, el borde y la marca, no solo por el color. */
.boton[aria-pressed='true'] {
  background: var(--color-acento-suave);
  border-color: var(--color-acento);
  color: var(--color-acento);
  font-weight: 600;
}
.boton[aria-pressed='true']::before {
  content: '✓';
}
</style>
