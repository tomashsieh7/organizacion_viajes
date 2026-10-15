<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import type { MensajeEnPantalla } from '../../stores/chat';
import { formatearMomento, nombreVisible } from '../../utiles/formato';

const props = defineProps<{ mensajes: MensajeEnPantalla[]; miId: string; hayMas: boolean }>();
const emit = defineEmits<{ anteriores: [] }>();
const lista = ref<HTMLElement | null>(null);

function alFinal() {
  const el = lista.value;
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80;
}

/** Al llegar un mensaje nuevo baja hasta él, salvo que se esté leyendo algo anterior. */
watch(
  () => props.mensajes.at(-1)?.id,
  async () => {
    const bajar = alFinal() || props.mensajes.at(-1)?.autor.id === props.miId;
    await nextTick();
    if (bajar && lista.value) lista.value.scrollTop = lista.value.scrollHeight;
  },
);

/** Al cargar mensajes anteriores conserva la posición de lectura. */
watch(
  () => props.mensajes[0]?.id,
  async (nuevo, viejo) => {
    if (!viejo || !lista.value) return;
    const alto = lista.value.scrollHeight;
    await nextTick();
    lista.value.scrollTop += lista.value.scrollHeight - alto;
  },
);

/** Carga hacia atrás al subir hasta arriba. */
function alDesplazar() {
  if (props.hayMas && lista.value && lista.value.scrollTop < 40) emit('anteriores');
}

onMounted(async () => {
  await nextTick();
  if (lista.value) lista.value.scrollTop = lista.value.scrollHeight;
});
</script>

<template>
  <div ref="lista" class="lista-mensajes" aria-live="polite" @scroll="alDesplazar">
    <button v-if="hayMas" type="button" class="boton anteriores" @click="emit('anteriores')">
      Ver mensajes anteriores
    </button>
    <p v-if="!mensajes.length" class="vacio">
      <span class="vacio__icono" aria-hidden="true">💬</span>
      Todavía no hay mensajes. ¡Escribí el primero!
    </p>
    <article
      v-for="m in mensajes"
      :key="m.idTemporal ?? m.id"
      class="mensaje"
      :class="{ propio: m.autor.id === miId }"
      :data-estado="m.estado"
    >
      <header>
        <strong>{{ m.autor.id === miId ? 'Vos' : nombreVisible(m.autor) }}</strong>
        <time :datetime="m.enviadoEn">{{ formatearMomento(m.enviadoEn) }}</time>
      </header>
      <p>{{ m.contenido }}</p>
      <small v-if="m.estado === 'pendiente'">Enviando…</small>
      <small v-else-if="m.estado === 'error'" class="fallo">No se pudo enviar</small>
    </article>
  </div>
</template>

<style scoped>
.lista-mensajes {
  /* Deja a la vista el campo para escribir, también con la barra inferior del celular. */
  height: clamp(14rem, calc(100dvh - 24rem), 32rem);
  overflow-y: auto;
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  padding: var(--esp-3);
  display: flex;
  flex-direction: column;
  gap: var(--esp-2);
}
.anteriores {
  align-self: center;
}
.vacio {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--esp-2);
  color: var(--color-texto-secundario);
  text-align: center;
}
.vacio__icono {
  font-size: 2.5rem;
}
.mensaje {
  max-width: min(80%, 32rem);
  background: var(--color-superficie-alt);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande) var(--radio-grande) var(--radio-grande) var(--esp-1);
  padding: var(--esp-2) var(--esp-3);
  align-self: flex-start;
}
.mensaje.propio {
  align-self: flex-end;
  background: var(--color-acento-suave);
  border-color: transparent;
  border-radius: var(--radio-grande) var(--radio-grande) var(--esp-1) var(--radio-grande);
}
.mensaje[data-estado='pendiente'] {
  opacity: 0.7;
}
header {
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  font-size: 0.85rem;
}
time {
  color: var(--color-texto-secundario);
  white-space: nowrap;
}
/* En celular también se resta la barra de navegación fija de abajo. */
@media (max-width: 47.99rem) {
  .lista-mensajes {
    height: clamp(12rem, calc(100dvh - 24rem - var(--alto-barra-inferior)), 32rem);
  }
}
.mensaje p {
  margin: 0.2rem 0 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.fallo {
  color: var(--color-error);
}
</style>
