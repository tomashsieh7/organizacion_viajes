<script setup lang="ts">
/**
 * Lista vacía: dice por qué no hay nada y ofrece la acción para empezar (en el slot), en lugar de
 * dejar un espacio en blanco.
 */
defineProps<{ icono: string; titulo: string; descripcion?: string }>();
</script>

<template>
  <div class="vacio">
    <span class="vacio__icono" aria-hidden="true">{{ icono }}</span>
    <p class="vacio__titulo">{{ titulo }}</p>
    <p v-if="descripcion" class="vacio__descripcion">{{ descripcion }}</p>
    <slot />
  </div>
</template>

<style scoped>
.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--esp-2);
  text-align: center;
  padding: var(--esp-6) var(--esp-4);
  background: var(--color-superficie);
  border: 1px dashed var(--color-borde-fuerte);
  border-radius: var(--radio-grande);
}
.vacio__icono {
  font-size: 2.5rem;
  line-height: 1;
}
.vacio__titulo {
  font-weight: 600;
  font-size: 1.0625rem;
  margin: 0;
}
.vacio__descripcion {
  color: var(--color-texto-secundario);
  max-width: 32rem;
  margin: 0 0 var(--esp-2);
}
</style>
