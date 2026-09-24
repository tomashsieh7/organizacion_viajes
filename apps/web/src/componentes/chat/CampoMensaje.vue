<script setup lang="ts">
import { computed, ref } from 'vue';

const emit = defineEmits<{ enviar: [contenido: string] }>();
defineProps<{ deshabilitado?: boolean }>();
const MAXIMO = 2000;
const texto = ref('');
const valido = computed(() => texto.value.trim().length > 0 && texto.value.trim().length <= MAXIMO);

function enviar() {
  if (!valido.value) return;
  emit('enviar', texto.value);
  texto.value = '';
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
      v-model="texto"
      rows="2"
      :maxlength="MAXIMO"
      placeholder="Escribí un mensaje"
      @keydown="alTeclear"
    ></textarea>
    <button type="submit" class="boton boton--principal" :disabled="!valido || deshabilitado">
      Enviar
    </button>
  </form>
</template>

<style scoped>
.campo-mensaje {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  align-items: flex-end;
}
textarea {
  flex: 1;
  font: inherit;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  resize: vertical;
}
.solo-lectores {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
