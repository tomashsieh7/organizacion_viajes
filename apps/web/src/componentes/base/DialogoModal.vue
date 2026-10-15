<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

defineProps<{ titulo: string }>();
const emit = defineEmits<{ cerrar: [] }>();

// Al abrirse, el foco pasa al diálogo y, al cerrarse, vuelve al elemento que lo abrió.
const dialogo = ref<HTMLElement | null>(null);
let focoAnterior: HTMLElement | null = null;

/**
 * Escape se escucha en todo el documento: si un botón del diálogo se deshabilita mientras espera
 * una respuesta, el navegador le saca el foco y lo deja fuera del diálogo.
 */
function alApretar(evento: KeyboardEvent) {
  if (evento.key === 'Escape') emit('cerrar');
}
onMounted(() => {
  focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialogo.value?.focus();
  document.addEventListener('keydown', alApretar);
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', alApretar);
  focoAnterior?.focus();
});
</script>

<template>
  <div class="fondo" @click.self="emit('cerrar')">
    <section
      ref="dialogo"
      class="dialogo"
      role="dialog"
      aria-modal="true"
      :aria-label="titulo"
      tabindex="-1"
    >
      <h2>{{ titulo }}</h2>
      <slot />
    </section>
  </div>
</template>

<style scoped>
.fondo {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: var(--fondo-modal);
  display: grid;
  place-items: center;
  padding: var(--esp-4);
}
.dialogo {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  box-shadow: var(--sombra-elevada);
  padding: var(--esp-5);
  width: min(30rem, 100%);
  max-height: 90vh;
  overflow: auto;
}
.dialogo:focus {
  outline: none;
}
.dialogo h2 {
  margin-top: 0;
}
</style>
