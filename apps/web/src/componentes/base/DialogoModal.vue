<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

defineProps<{ titulo: string }>();
const emit = defineEmits<{ cerrar: [] }>();

// Al abrirse, el foco pasa al diálogo (así Escape lo cierra sin hacer clic antes) y, al
// cerrarse, vuelve al elemento que lo abrió.
const dialogo = ref<HTMLElement | null>(null);
let focoAnterior: HTMLElement | null = null;
onMounted(() => {
  focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialogo.value?.focus();
});
onBeforeUnmount(() => focoAnterior?.focus());
</script>

<template>
  <div class="fondo" @click.self="emit('cerrar')" @keydown.esc="emit('cerrar')">
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
  background: rgb(0 0 0 / 0.4);
  display: grid;
  place-items: center;
  padding: 1rem;
}
.dialogo {
  background: var(--color-fondo);
  border-radius: var(--radio);
  padding: 1.25rem;
  width: min(28rem, 100%);
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
