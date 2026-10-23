<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AccionSobrePropuesta, Moneda, PropuestaVista, ValorVoto } from '@viajes/compartido';
import DialogoModal from '../base/DialogoModal.vue';
import IconoLinea from '../base/IconoLinea.vue';
import { formatearMonto, ICONOS_ESTADO, NOMBRES_ESTADO } from '../../utiles/formato';

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
/**
 * Voto como una encuesta de WhatsApp: un renglón por opción que se llena según la parte de los
 * votos que tiene, con tilde en el propio. Tocar el voto propio otra vez lo saca (P6), así no
 * hace falta un botón aparte para retirarlo.
 */
const VOTOS = {
  A_FAVOR: { corto: 'Sí', texto: 'A favor' },
  EN_CONTRA: { corto: 'No', texto: 'En contra' },
} as const satisfies Record<ValorVoto, { corto: string; texto: string }>;
const cantidad = (valor: ValorVoto) =>
  valor === 'A_FAVOR' ? props.propuesta.votosAFavor : props.propuesta.votosEnContra;
const totalVotos = computed(() => props.propuesta.votosAFavor + props.propuesta.votosEnContra);
const parte = (valor: ValorVoto) =>
  totalVotos.value ? Math.round((cantidad(valor) / totalVotos.value) * 100) : 0;
function alVotar(valor: ValorVoto) {
  if (props.propuesta.miVoto === valor) emit('desvotar');
  else emit('votar', valor);
}
/** En la grilla compacta la descripción larga se corta; tocarla la muestra entera. */
const descripcionAbierta = ref(false);
/** Ícono de cada estado; acompaña al texto y al color de la insignia. */
/** Acciones del Admin según el estado (RN-R1), con la principal al final, en el extremo derecho. */
const accionesAdmin = computed<{ accion: AccionSobrePropuesta; texto: string }[]>(() => {
  if (!props.soyAdmin) return [];
  if (props.propuesta.estado === 'PENDIENTE') {
    return [
      { accion: 'denegar', texto: 'Denegar' },
      { accion: 'confirmar', texto: 'Confirmar' },
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
        <IconoLinea :nombre="ICONOS_ESTADO[propuesta.estado]" :tamano="14" />
        {{ NOMBRES_ESTADO[propuesta.estado] }}
      </span>
    </header>
    <slot />
    <!-- La descripción es opcional (RN-X8): sin ella no queda un renglón vacío. -->
    <p
      v-if="propuesta.descripcion"
      class="descripcion"
      :class="{ 'descripcion--abierta': descripcionAbierta }"
      :title="propuesta.descripcion"
      @click="descripcionAbierta = !descripcionAbierta"
    >
      {{ propuesta.descripcion }}
    </p>
    <p class="meta">
      <IconoLinea nombre="pin" :tamano="16" /> {{ propuesta.ubicacion }}
      <template v-if="propuesta.precio !== null">
        · <span class="monto">{{ formatearMonto(propuesta.precio, moneda) }}</span></template
      >
      · propuesta por {{ propuesta.autor.nombre }}
    </p>
    <footer>
      <div class="votos" role="group" aria-label="Votos">
        <component
          :is="pendiente ? 'button' : 'div'"
          v-for="valor in ['A_FAVOR', 'EN_CONTRA'] as const"
          :key="valor"
          class="voto"
          :class="{ 'voto--cerrada': !pendiente }"
          v-bind="
            pendiente
              ? {
                  type: 'button',
                  disabled: ocupada,
                  'aria-pressed': propuesta.miVoto === valor,
                  'aria-label': VOTOS[valor].texto,
                }
              : { 'aria-hidden': 'true' }
          "
          @click="pendiente && alVotar(valor)"
        >
          <span class="voto__relleno" :style="{ width: `${parte(valor)}%` }"></span>
          <span class="voto__marca">
            <IconoLinea v-if="propuesta.miVoto === valor" nombre="check" :tamano="16" />
          </span>
          <span class="voto__texto">{{ VOTOS[valor].corto }}</span>
          <span class="voto__cantidad">{{ cantidad(valor) }}</span>
        </component>
        <span class="solo-lectores"
          >Votos: {{ propuesta.votosAFavor }} a favor y {{ propuesta.votosEnContra }} en
          contra</span
        >
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
  display: flex;
  flex-direction: column;
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
/* Los votos arriba y las acciones del Admin debajo, a todo el ancho de la tarjeta. */
footer {
  display: flex;
  flex-direction: column;
  gap: var(--esp-3);
  /* Si la tarjeta se estira para igualar a las de al lado, los votos y botones quedan abajo. */
  margin-top: auto;
  padding-top: var(--esp-3);
  border-top: 1px solid var(--color-borde);
}
.votos {
  display: flex;
  flex-direction: column;
  gap: var(--esp-2);
}
.voto {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: var(--esp-2);
  min-height: 2.75rem;
  padding: 0 var(--esp-3);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  background: var(--color-superficie);
  color: var(--color-texto);
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.voto:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.voto--cerrada {
  cursor: default;
  color: var(--color-texto-secundario);
}
/* El voto propio: borde del color del texto y la tilde, sin sumar colores. */
.voto[aria-pressed='true'] {
  border-color: var(--color-texto);
}
/* El renglón se llena con la parte de los votos que tiene esa opción. */
.voto__relleno {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--color-superficie-alt);
  transition: width var(--duracion);
}
.voto[aria-pressed='true'] .voto__relleno {
  background: var(--color-borde);
}
.voto__marca,
.voto__texto,
.voto__cantidad {
  position: relative;
}
/* Un círculo vacío que se vuelve tilde al votar. */
.voto__marca {
  display: inline-grid;
  place-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 1.5px solid var(--color-borde-fuerte);
  border-radius: 50%;
}
.voto[aria-pressed='true'] .voto__marca {
  border-color: transparent;
}
.voto__texto {
  flex: 1;
}
.voto__cantidad {
  font-variant-numeric: tabular-nums;
}
.admin {
  display: flex;
  justify-content: flex-end;
  gap: var(--esp-2);
  flex-wrap: wrap;
}
/* En celular los botones se reparten el ancho de la tarjeta, más fáciles de tocar. */
@media (max-width: 47.99rem) {
  .admin .boton {
    flex: 1;
  }
}
</style>
