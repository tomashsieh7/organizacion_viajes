<script setup lang="ts">
defineProps<{ tipo?: 'error' | 'info' | 'exito' }>();
</script>

<template>
  <p
    class="aviso"
    :class="`aviso--${tipo ?? 'info'}`"
    :role="tipo === 'error' ? 'alert' : 'status'"
  >
    <slot />
  </p>
</template>

<style scoped>
.aviso {
  padding: 0.6rem 0.8rem;
  border-radius: var(--radio);
  border: 1px solid var(--color-borde);
  background: var(--color-superficie);
}
.aviso--error {
  border-color: var(--color-error);
  color: var(--color-error);
}
.aviso--exito {
  border-color: var(--color-exito);
  color: var(--color-exito);
}
</style>
