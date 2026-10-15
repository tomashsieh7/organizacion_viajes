<script setup lang="ts">
import { computed } from 'vue';
import type { Participante } from '@viajes/compartido';
import InicialPersona from '../base/InicialPersona.vue';
import { nombreVisible } from '../../utiles/formato';

const props = defineProps<{ participantes: Participante[]; soyAdmin: boolean; miId: string }>();
const emit = defineEmits<{ eliminar: [participante: Participante] }>();

/** Como los miembros de un servidor de chat: primero quien administra y después el resto. */
const grupos = computed(() =>
  [
    { titulo: 'Admin', lista: props.participantes.filter((p) => p.rol === 'ADMIN') },
    {
      titulo: `Viajeros (${props.participantes.filter((p) => p.rol !== 'ADMIN').length})`,
      lista: props.participantes.filter((p) => p.rol !== 'ADMIN'),
    },
  ].filter((g) => g.lista.length),
);
</script>

<template>
  <div class="participantes">
    <section v-for="g in grupos" :key="g.titulo" class="grupo-rol">
      <h3 class="grupo-rol__titulo">{{ g.titulo }}</h3>
      <ul class="panel lista">
        <li v-for="p in g.lista" :key="p.usuarioId" class="participante">
          <span class="quien">
            <InicialPersona :nombre="p.nombre" />
            {{ nombreVisible(p) }}
            <span v-if="p.usuarioId === miId" class="etiqueta">vos</span>
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
    </section>
  </div>
</template>

<style scoped>
.participantes {
  margin-bottom: var(--esp-4);
}
.grupo-rol__titulo {
  margin: var(--esp-4) 0 var(--esp-2);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-texto-secundario);
}
.lista {
  list-style: none;
  /* Cada participante lleva su propio relleno, separado por una línea. */
  padding: 0;
  margin: 0;
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
</style>
