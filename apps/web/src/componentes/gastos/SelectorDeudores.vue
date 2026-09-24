<script setup lang="ts">
import { computed } from 'vue';
import type { Participante } from '@viajes/compartido';
import { nombreVisible } from '../../utiles/formato';

/**
 * RN-G3 (P13): quiénes tienen que pagar. Arranca sin nadie marcado; el botón alterna entre
 * seleccionar a todos y quitar a todos. El resultado sigue el orden de la lista, que es el que
 * decide a quién van las unidades que sobran al dividir en partes iguales.
 */
const props = defineProps<{ participantes: Participante[]; error?: string | undefined }>();
const elegidos = defineModel<string[]>({ required: true });

const todos = computed(
  () => props.participantes.length > 0 && elegidos.value.length === props.participantes.length,
);

function alternarTodos() {
  elegidos.value = todos.value ? [] : props.participantes.map((p) => p.usuarioId);
}

function alternar(usuarioId: string, marcado: boolean) {
  const conjunto = new Set(elegidos.value);
  if (marcado) conjunto.add(usuarioId);
  else conjunto.delete(usuarioId);
  elegidos.value = props.participantes.map((p) => p.usuarioId).filter((id) => conjunto.has(id));
}
</script>

<template>
  <fieldset class="selector-deudores">
    <legend>¿Quiénes tienen que pagar?</legend>
    <button type="button" class="boton" @click="alternarTodos">
      {{ todos ? 'Quitar a todos' : 'Seleccionar a todos' }}
    </button>
    <label v-for="p in participantes" :key="p.usuarioId" class="opcion">
      <input
        type="checkbox"
        :value="p.usuarioId"
        :checked="elegidos.includes(p.usuarioId)"
        @change="alternar(p.usuarioId, ($event.target as HTMLInputElement).checked)"
      />
      {{ nombreVisible(p) }}
    </label>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </fieldset>
</template>

<style scoped>
.selector-deudores {
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  padding: 0.5rem 1rem 0.75rem;
  margin: 0 0 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-start;
}
.opcion {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.error {
  color: var(--color-error);
  font-size: 0.85rem;
  margin: 0;
}
</style>
