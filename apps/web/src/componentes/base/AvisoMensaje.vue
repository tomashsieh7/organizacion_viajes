<script setup lang="ts">
defineProps<{ tipo?: 'error' | 'info' | 'exito' }>();

/** El ícono acompaña al color, para que el tipo de aviso no dependa solo de él. */
const ICONOS = { error: '⚠', info: 'ℹ', exito: '✓' } as const;
</script>

<template>
  <p
    class="aviso"
    :class="`aviso--${tipo ?? 'info'}`"
    :role="tipo === 'error' ? 'alert' : 'status'"
  >
    <span class="aviso__icono" aria-hidden="true">{{ ICONOS[tipo ?? 'info'] }}</span>
    <span><slot /></span>
  </p>
</template>

<style scoped>
.aviso {
  display: flex;
  gap: var(--esp-2);
  align-items: flex-start;
  padding: var(--esp-3) var(--esp-4);
  margin: 0 0 var(--esp-4);
  border-radius: var(--radio);
  border: 1px solid var(--color-borde);
  border-left-width: 4px;
  border-left-color: var(--color-acento);
  background: var(--color-acento-suave);
  color: var(--color-texto);
}
.aviso__icono {
  font-weight: 700;
  color: var(--color-acento);
}
.aviso--error {
  border-color: var(--color-error);
  background: var(--color-error-suave);
}
.aviso--error .aviso__icono {
  color: var(--color-error);
}
.aviso--exito {
  border-color: var(--color-exito);
  background: var(--color-exito-suave);
}
.aviso--exito .aviso__icono {
  color: var(--color-exito);
}
</style>
