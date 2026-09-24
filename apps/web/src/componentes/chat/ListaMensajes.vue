<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import type { MensajeEnPantalla } from '../../stores/chat';
import { nombreVisible } from '../../utiles/formato';

const props = defineProps<{ mensajes: MensajeEnPantalla[]; miId: string; hayMas: boolean }>();
const emit = defineEmits<{ anteriores: [] }>();
const lista = ref<HTMLElement | null>(null);

const hora = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

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
    <p v-if="!mensajes.length" class="vacio">Todavía no hay mensajes. ¡Escribí el primero!</p>
    <article
      v-for="m in mensajes"
      :key="m.idTemporal ?? m.id"
      class="mensaje"
      :class="{ propio: m.autor.id === miId }"
      :data-estado="m.estado"
    >
      <header>
        <strong>{{ m.autor.id === miId ? 'Vos' : nombreVisible(m.autor) }}</strong>
        <time :datetime="m.enviadoEn">{{ hora(m.enviadoEn) }}</time>
      </header>
      <p>{{ m.contenido }}</p>
      <small v-if="m.estado === 'pendiente'">Enviando…</small>
      <small v-else-if="m.estado === 'error'" class="fallo">No se pudo enviar</small>
    </article>
  </div>
</template>

<style scoped>
.lista-mensajes {
  height: 26rem;
  overflow-y: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.anteriores {
  align-self: center;
}
.vacio {
  color: #57606a;
  text-align: center;
}
.mensaje {
  max-width: 75%;
  background: var(--color-superficie);
  border-radius: var(--radio);
  padding: 0.4rem 0.7rem;
  align-self: flex-start;
}
.mensaje.propio {
  align-self: flex-end;
  background: #ddf4ff;
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
  color: #57606a;
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
