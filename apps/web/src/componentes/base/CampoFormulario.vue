<script setup lang="ts">
defineProps<{ etiqueta: string; error?: string | undefined; id: string }>();
</script>

<template>
  <div class="campo">
    <label :for="id">{{ etiqueta }}</label>
    <slot />
    <p v-if="error" :id="`${id}-error`" class="campo__error" role="alert">
      <span aria-hidden="true">⚠ </span>{{ error }}
    </p>
  </div>
</template>

<style scoped>
.campo {
  display: flex;
  flex-direction: column;
  gap: var(--esp-1);
  margin-bottom: var(--esp-4);
}
.campo__error {
  color: var(--color-error);
  font-size: 0.875rem;
  margin: 0;
}
</style>
