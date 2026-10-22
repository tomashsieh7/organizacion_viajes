<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { esquemaMensajeNuevo, LARGOS_MAXIMOS } from '@viajes/compartido';
import IconoLinea from '../base/IconoLinea.vue';

const emit = defineEmits<{ enviar: [contenido: string] }>();
defineProps<{ deshabilitado?: boolean }>();
const MAXIMO = LARGOS_MAXIMOS.mensaje;
const texto = ref('');
const campo = ref<HTMLTextAreaElement | null>(null);
/** RN-X8: el mismo control que el servidor; un campo vacío no muestra error, solo no envía. */
const revision = computed(() => esquemaMensajeNuevo.shape.contenido.safeParse(texto.value));
const valido = computed(() => revision.value.success);
const problema = computed(() =>
  texto.value.trim() && !revision.value.success ? revision.value.error.issues[0]?.message : '',
);

/** El campo crece con el texto hasta un máximo; después aparece la barra de desplazamiento. */
function ajustarAlto() {
  const el = campo.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

async function enviar() {
  if (!valido.value) return;
  emit('enviar', texto.value);
  texto.value = '';
  await nextTick();
  ajustarAlto();
}

/** Enter envía y Mayús + Enter agrega un salto de línea. */
function alTeclear(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    enviar();
  }
}
</script>

<template>
  <form class="campo-mensaje" @submit.prevent="enviar">
    <label for="mensaje" class="solo-lectores">Mensaje</label>
    <textarea
      id="mensaje"
      ref="campo"
      v-model="texto"
      rows="1"
      :maxlength="MAXIMO"
      placeholder="Escribí un mensaje"
      :aria-invalid="problema ? 'true' : undefined"
      :aria-describedby="problema ? 'mensaje-problema' : undefined"
      @keydown="alTeclear"
      @input="ajustarAlto"
    ></textarea>
    <button
      type="submit"
      class="boton boton--principal enviar"
      aria-label="Enviar"
      :disabled="!valido || deshabilitado"
    >
      <IconoLinea nombre="enviar" :tamano="20" />
    </button>
    <p v-if="problema" id="mensaje-problema" class="problema" role="alert">{{ problema }}</p>
  </form>
</template>

<style scoped>
.campo-mensaje {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2);
  margin-top: var(--esp-3);
  align-items: flex-end;
}
textarea {
  flex: 1;
  min-height: var(--alto-control);
  /* Unos cinco renglones; más allá, se desplaza adentro del campo. */
  max-height: 8.5rem;
  resize: none;
  border-radius: 1.4rem;
  padding-inline: var(--esp-4);
}
.problema {
  flex-basis: 100%;
  margin: 0;
  color: var(--color-error);
  font-size: 0.85rem;
}
/* Botón redondo con solo el ícono; el nombre accesible lo da aria-label. */
.enviar {
  flex: none;
  width: var(--alto-control);
  padding: 0;
}
</style>
