<script setup lang="ts">
defineProps<{ etiqueta: string; error?: string | undefined; id: string }>();
</script>

<template>
  <div class="campo">
    <label :for="id">{{ etiqueta }}</label>
    <slot />
    <p v-if="error" class="campo__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.campo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.9rem;
}
.campo__error {
  color: var(--color-error);
  font-size: 0.85rem;
  margin: 0;
}
</style>
