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
  gap: var(--esp-2);
  margin-top: var(--esp-3);
  align-items: flex-end;
}
textarea {
  flex: 1;
  min-height: var(--alto-control);
}
</style>
