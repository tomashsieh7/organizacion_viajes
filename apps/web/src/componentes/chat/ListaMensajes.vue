<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { MensajeEnPantalla } from '../../stores/chat';
import { etiquetaDelDia, formatearHora, nombreVisible } from '../../utiles/formato';

const props = defineProps<{ mensajes: MensajeEnPantalla[]; miId: string; hayMas: boolean }>();
const emit = defineEmits<{ anteriores: []; reintentar: [id: string] }>();
const lista = ref<HTMLElement | null>(null);

/** Mensajes seguidos de la misma persona, a menos de 5 minutos, se muestran como un bloque. */
const PAUSA_MS = 5 * 60_000;

type Fila =
  | { tipo: 'dia'; clave: string; etiqueta: string }
  | { tipo: 'mensaje'; clave: string; m: MensajeEnPantalla; conNombre: boolean };

/** Separadores de día ("Hoy", "Ayer", "24 sep") y mensajes agrupados por persona. */
const filas = computed<Fila[]>(() => {
  const resultado: Fila[] = [];
  let diaAnterior = '';
  let anterior: MensajeEnPantalla | undefined;
  for (const m of props.mensajes) {
    const dia = etiquetaDelDia(m.enviadoEn);
    const nuevoDia = dia !== diaAnterior;
    if (nuevoDia) resultado.push({ tipo: 'dia', clave: `dia-${m.enviadoEn}`, etiqueta: dia });
    const seguido =
      !nuevoDia &&
      anterior?.autor.id === m.autor.id &&
      Date.parse(m.enviadoEn) - Date.parse(anterior.enviadoEn) < PAUSA_MS;
    resultado.push({ tipo: 'mensaje', clave: m.id, m, conNombre: !seguido });
    diaAnterior = dia;
    anterior = m;
  }
  return resultado;
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

/**
 * Un mensaje de otro que llega cuando hay uno propio esperando o fallado se ubica antes de ese, sin
 * cambiar el último: si se estaba al final, se sigue al final.
 */
watch(
  () => props.mensajes.filter((m) => m.estado === 'enviado').length,
  async () => {
    const bajar = alFinal();
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
    <template v-for="f in filas" :key="f.clave">
      <div v-if="f.tipo === 'dia'" class="separador" role="separator" :aria-label="f.etiqueta">
        <span>{{ f.etiqueta }}</span>
      </div>
      <article
        v-else
        class="mensaje"
        :class="{ propio: f.m.autor.id === miId, seguido: !f.conNombre }"
        :data-estado="f.m.estado"
      >
        <!-- El nombre se ve solo al empezar un bloque; los lectores de pantalla lo leen siempre. -->
        <strong
          class="mensaje__autor"
          :class="{ 'solo-lectores': f.m.autor.id === miId || !f.conNombre }"
          >{{ f.m.autor.id === miId ? 'Vos' : nombreVisible(f.m.autor) }}</strong
        >
        <p>{{ f.m.contenido }}</p>
        <footer class="mensaje__pie">
          <small v-if="f.m.estado === 'pendiente'">Enviando…</small>
          <template v-else-if="f.m.estado === 'error'">
            <small class="fallo">No se pudo enviar</small>
            <button type="button" class="reintentar" @click="emit('reintentar', f.m.id)">
              Reintentar
            </button>
          </template>
          <time :datetime="f.m.enviadoEn">{{ formatearHora(f.m.enviadoEn) }}</time>
        </footer>
      </article>
    </template>
  </div>
</template>

<style scoped>
.lista-mensajes {
  /*
   * Contiene los textos solo para lectores de pantalla (`position: absolute`), que si no se
   * ubican fuera de la lista y estiran la página por debajo del campo para escribir.
   */
  position: relative;
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
.mensaje.seguido {
  margin-top: calc(-1 * var(--esp-1));
}
.mensaje__autor {
  display: block;
  font-size: 0.85rem;
}
.mensaje__pie {
  display: flex;
  justify-content: flex-end;
  gap: var(--esp-2);
  margin-top: 0.1rem;
  font-size: 0.75rem;
  color: var(--color-texto-secundario);
}
time {
  white-space: nowrap;
}
/* Separador de día, como una etiqueta centrada sobre una línea. */
.separador {
  display: flex;
  align-items: center;
  gap: var(--esp-2);
  margin: var(--esp-2) 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-texto-secundario);
}
.separador::before,
.separador::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--color-borde);
}
/* En celular también se resta la barra de navegación fija de abajo. */
@media (max-width: 47.99rem) {
  .lista-mensajes {
    height: clamp(12rem, calc(100dvh - 24rem - var(--alto-barra-inferior)), 32rem);
  }
}
.mensaje p {
  margin: 0.1rem 0 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.fallo {
  color: var(--color-error);
}
.reintentar {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-acento);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
}
</style>
