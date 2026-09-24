<script setup lang="ts">
import type { Participante } from '@viajes/compartido';
import { nombreVisible } from '../../utiles/formato';

defineProps<{ participantes: Participante[]; soyAdmin: boolean; miId: string }>();
const emit = defineEmits<{ eliminar: [participante: Participante] }>();
</script>

<template>
  <ul class="participantes">
    <li v-for="p in participantes" :key="p.usuarioId" class="participante">
      <span>
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
}
.participante {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-borde);
}
</style>
