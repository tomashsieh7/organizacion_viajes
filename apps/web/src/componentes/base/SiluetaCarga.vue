<script setup lang="ts">
/**
 * Siluetas con la forma de las tarjetas mientras se carga una lista: se perciben más rápidas que
 * un texto suelto. Los lectores de pantalla escuchan "Cargando…".
 */
withDefaults(defineProps<{ cantidad?: number }>(), { cantidad: 3 });
</script>

<template>
  <div class="siluetas" aria-busy="true">
    <span class="solo-lectores" role="status">Cargando…</span>
    <div v-for="n in cantidad" :key="n" class="silueta" aria-hidden="true">
      <span class="linea linea--titulo"></span>
      <span class="linea"></span>
      <span class="linea linea--corta"></span>
    </div>
  </div>
</template>

<style scoped>
.siluetas {
  display: grid;
  gap: var(--esp-3);
}
.silueta {
  display: grid;
  gap: var(--esp-2);
  padding: var(--esp-4);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
}
.linea {
  height: 0.875rem;
  border-radius: 999px;
  background: var(--color-superficie-alt);
  animation: latido 1.4s ease-in-out infinite;
}
.linea--titulo {
  width: 45%;
  height: 1.125rem;
}
.linea--corta {
  width: 30%;
}
@keyframes latido {
  50% {
    opacity: 0.45;
  }
}
</style>
