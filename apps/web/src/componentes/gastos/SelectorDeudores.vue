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

const inicial = (p: Participante) => nombreVisible(p).charAt(0).toUpperCase();

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
    <legend class="solo-lectores">¿Quiénes tienen que pagar?</legend>
    <div class="encabezado">
      <span class="encabezado__titulo" aria-hidden="true">¿Quiénes tienen que pagar?</span>
      <span class="encabezado__cuenta texto-secundario" aria-live="polite"
        >{{ elegidos.length }} de {{ participantes.length }}</span
      >
      <button type="button" class="boton boton--chico" @click="alternarTodos">
        {{ todos ? 'Quitar a todos' : 'Seleccionar a todos' }}
      </button>
    </div>
    <ul class="personas">
      <li v-for="p in participantes" :key="p.usuarioId">
        <label class="persona" :class="{ elegida: elegidos.includes(p.usuarioId) }">
          <span class="persona__inicial" aria-hidden="true">{{ inicial(p) }}</span>
          <span class="persona__nombre">{{ nombreVisible(p) }}</span>
          <input
            type="checkbox"
            class="persona__casilla"
            :value="p.usuarioId"
            :checked="elegidos.includes(p.usuarioId)"
            @change="alternar(p.usuarioId, ($event.target as HTMLInputElement).checked)"
          />
        </label>
      </li>
    </ul>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </fieldset>
</template>

<style scoped>
.selector-deudores {
  border: none;
  padding: 0;
  margin: 0 0 var(--esp-4);
  min-width: 0;
}
.encabezado {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--esp-1) var(--esp-3);
  margin-bottom: var(--esp-2);
}
.encabezado__titulo {
  font-weight: 600;
}
.encabezado__cuenta {
  flex: 1;
  font-size: 0.875rem;
  white-space: nowrap;
}
.personas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--esp-2);
}
/* Cada persona es una fila entera que se puede tocar; la casilla real queda a la derecha. */
.persona {
  display: flex;
  align-items: center;
  gap: var(--esp-3);
  min-height: 3rem;
  padding: var(--esp-2) var(--esp-3);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  background: var(--color-superficie);
  cursor: pointer;
  transition:
    background-color var(--duracion),
    border-color var(--duracion);
}
.persona:hover {
  border-color: var(--color-borde-fuerte);
}
.persona.elegida {
  border-color: var(--color-acento);
  background: var(--color-acento-suave);
}
.persona__inicial {
  flex: none;
  width: 2rem;
  height: 2rem;
  display: grid;
  place-content: center;
  border-radius: 999px;
  background: var(--color-superficie-alt);
  font-weight: 700;
  font-size: 0.875rem;
}
.persona.elegida .persona__inicial {
  background: var(--color-acento);
  color: var(--color-sobre-acento);
}
.persona__nombre {
  flex: 1;
  min-width: 0;
}
.persona__casilla {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-acento);
}
.error {
  color: var(--color-error);
  font-size: 0.875rem;
  margin: var(--esp-2) 0 0;
}
</style>
