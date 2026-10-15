<script setup lang="ts">
/** `ayuda`: texto bajo el campo; el control lo enlaza con `aria-describedby` a `{id}-ayuda`. */
defineProps<{ etiqueta: string; error?: string | undefined; id: string; ayuda?: string }>();
</script>

<template>
  <div class="campo">
    <label :for="id">{{ etiqueta }}</label>
    <slot />
    <small v-if="ayuda" :id="`${id}-ayuda`" class="ayuda">{{ ayuda }}</small>
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
