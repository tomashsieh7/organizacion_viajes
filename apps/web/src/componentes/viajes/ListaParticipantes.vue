<script setup lang="ts">
import type { Participante } from '@viajes/compartido';
import { nombreVisible } from '../../utiles/formato';

defineProps<{ participantes: Participante[]; soyAdmin: boolean; miId: string }>();
const emit = defineEmits<{ eliminar: [participante: Participante] }>();
</script>

<template>
  <ul class="participantes">
    <li v-for="p in participantes" :key="p.usuarioId" class="participante">
      <span class="quien">
        <span class="inicial" aria-hidden="true">{{ p.nombre.charAt(0).toUpperCase() }}</span>
        {{ nombreVisible(p) }}
        <span v-if="p.usuarioId === miId" class="etiqueta">vos</span>
        <span v-if="p.rol === 'ADMIN'" class="etiqueta">Admin</span>
      </span>
      <button
        v-if="soyAdmin && p.usuarioId !== miId"
        class="boton boton--peligro"
        type="button"
        :aria-label="`Eliminar a ${p.nombre}`"
        @click="emit('eliminar', p)"
      >
        Eliminar
      </button>
    </li>
  </ul>
</template>

<style scoped>
.participantes {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--esp-4);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  box-shadow: var(--sombra);
}
.participante {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--esp-3);
  padding: var(--esp-3) var(--esp-4);
}
.participante + .participante {
  border-top: 1px solid var(--color-borde);
}
.quien {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--esp-1) var(--esp-2);
}
.inicial {
  display: inline-grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: var(--color-acento-suave);
  color: var(--color-acento);
  font-weight: 700;
}
</style>
