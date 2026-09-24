<script setup lang="ts">
defineProps<{ titulo: string }>();
const emit = defineEmits<{ cerrar: [] }>();
</script>

<template>
  <div class="fondo" @click.self="emit('cerrar')" @keydown.esc="emit('cerrar')">
    <section class="dialogo" role="dialog" aria-modal="true" :aria-label="titulo">
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
.dialogo h2 {
  margin-top: 0;
}
</style>
