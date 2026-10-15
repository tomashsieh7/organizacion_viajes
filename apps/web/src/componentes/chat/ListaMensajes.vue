<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { EMOJIS_REACCION, type ReaccionVista } from '@viajes/compartido';
import IconoLinea from '../base/IconoLinea.vue';
import type { MensajeEnPantalla } from '../../stores/chat';
import { etiquetaDelDia, formatearHora, nombreVisible } from '../../utiles/formato';

const props = defineProps<{ mensajes: MensajeEnPantalla[]; miId: string; hayMas: boolean }>();
const emit = defineEmits<{
  anteriores: [];
  reaccionar: [mensajeId: string, emoji: string | null];
}>();
const lista = ref<HTMLElement | null>(null);
/** Mensaje con el selector de reacciones abierto. */
const eligiendo = ref<string | null>(null);

const esMia = (r: ReaccionVista) => r.usuarios.some((u) => u.id === props.miId);
const miReaccion = (m: MensajeEnPantalla) => m.reacciones.find(esMia)?.emoji ?? null;

/** "Ana", "Ana y vos" o "Ana, Tomás y vos": quién reaccionó, para el título y el lector. */
function quienes(r: ReaccionVista) {
  const nombres = r.usuarios.map((u) => (u.id === props.miId ? 'vos' : u.nombre));
  return nombres.length > 1
    ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
    : (nombres[0] ?? '');
}

/** Una reacción por persona: tocar la propia la quita y elegir otra la reemplaza. */
function reaccionar(m: MensajeEnPantalla, emoji: string) {
  emit('reaccionar', m.id, miReaccion(m) === emoji ? null : emoji);
}

async function abrirSelector(mensajeId: string) {
  if (eligiendo.value === mensajeId) return cerrarSelector();
  eligiendo.value = mensajeId;
  await nextTick();
  lista.value?.querySelector<HTMLButtonElement>('.selector button')?.focus();
}

/** Cierra el selector y devuelve el foco al botón que lo abrió. */
async function cerrarSelector() {
  const id = eligiendo.value;
  eligiendo.value = null;
  await nextTick();
  lista.value?.querySelector<HTMLButtonElement>(`[data-reaccionar="${id}"]`)?.focus();
}

function elegir(m: MensajeEnPantalla, emoji: string) {
  reaccionar(m, emoji);
  void cerrarSelector();
}

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
    resultado.push({ tipo: 'mensaje', clave: m.idTemporal ?? m.id, m, conNombre: !seguido });
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
          <small v-else-if="f.m.estado === 'error'" class="fallo">No se pudo enviar</small>
          <button
            v-else
            type="button"
            class="reaccionar"
            aria-label="Reaccionar"
            :aria-expanded="eligiendo === f.m.id"
            :data-reaccionar="f.m.id"
            @click="abrirSelector(f.m.id)"
          >
            <IconoLinea nombre="reaccionar" :tamano="16" />
          </button>
          <time :datetime="f.m.enviadoEn">{{ formatearHora(f.m.enviadoEn) }}</time>
        </footer>
        <div
          v-if="eligiendo === f.m.id"
          class="selector"
          role="group"
          aria-label="Elegí una reacción"
          @keydown.esc.stop="cerrarSelector"
        >
          <button
            v-for="e in EMOJIS_REACCION"
            :key="e"
            type="button"
            :aria-label="`Reaccionar con ${e}`"
            :aria-pressed="miReaccion(f.m) === e"
            @click="elegir(f.m, e)"
          >
            {{ e }}
          </button>
        </div>
        <div v-if="f.m.reacciones.length" class="reacciones">
          <button
            v-for="r in f.m.reacciones"
            :key="r.emoji"
            type="button"
            class="reaccion"
            :aria-pressed="esMia(r)"
            :aria-label="`${r.emoji} de ${quienes(r)}`"
            :title="quienes(r)"
            @click="reaccionar(f.m, r.emoji)"
          >
            <span aria-hidden="true">{{ r.emoji }}</span>
            <span aria-hidden="true">{{ r.usuarios.length }}</span>
          </button>
        </div>
      </article>
    </template>
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
/* Botón chico al lado de la hora; el área táctil es mayor que el ícono. */
.reaccionar {
  display: inline-grid;
  place-items: center;
  min-width: 1.5rem;
  min-height: 1.5rem;
  margin: -0.25rem 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  color: inherit;
  cursor: pointer;
}
.reaccionar:hover {
  color: var(--color-texto);
}
.selector {
  display: flex;
  gap: 0.1rem;
  width: fit-content;
  margin-top: var(--esp-1);
  padding: 0.15rem;
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 999px;
  box-shadow: var(--sombra-elevada);
}
.selector button {
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  font-size: 1.15rem;
  cursor: pointer;
}
.selector button:hover,
.selector button[aria-pressed='true'] {
  background: var(--color-acento-suave);
}
.reacciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-1);
  margin-top: var(--esp-1);
}
.reaccion {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 1.75rem;
  padding: 0 0.5rem;
  border: 1px solid var(--color-borde);
  border-radius: 999px;
  background: var(--color-superficie);
  color: var(--color-texto);
  font-size: 0.85rem;
  cursor: pointer;
}
.reaccion[aria-pressed='true'] {
  border-color: var(--color-acento);
  background: var(--color-acento-suave);
}
</style>
