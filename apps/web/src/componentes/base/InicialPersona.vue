<script setup lang="ts">
import { computed } from 'vue';

/**
 * Círculo con la inicial de una persona, para participantes, quiénes pagan y otras listas. Es
 * decorativo: el nombre siempre va escrito al lado. Cuando haya fotos de perfil, van acá.
 */
const props = withDefaults(defineProps<{ nombre: string; tamano?: number }>(), { tamano: 36 });
const inicial = computed(() => props.nombre.trim().charAt(0).toUpperCase());
</script>

<template>
  <span
    class="inicial-persona"
    aria-hidden="true"
    :style="{ width: `${tamano}px`, height: `${tamano}px`, fontSize: `${tamano * 0.42}px` }"
    >{{ inicial }}</span
  >
</template>

<style scoped>
.inicial-persona {
  flex: none;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-superficie-alt);
  color: var(--color-texto);
  font-weight: 700;
}
</style>
