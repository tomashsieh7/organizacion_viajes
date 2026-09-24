<script setup lang="ts">
import type { ConflictoHorario } from '@viajes/compartido';
import { formatearHorario } from '../../utiles/formato';

/** RN-A2: muestra las actividades confirmadas con las que choca el horario elegido. */
defineProps<{ conflictos: ConflictoHorario[] }>();
</script>

<template>
  <div class="aviso-superposicion" role="alert">
    <p>
      El horario se superpone con
      {{ conflictos.length === 1 ? 'una actividad confirmada' : 'actividades confirmadas' }}:
    </p>
    <ul>
      <li v-for="c in conflictos" :key="c.id">
        <strong>{{ c.titulo }}</strong
        >, {{ formatearHorario(c) }}
      </li>
    </ul>
    <p>
      <slot>Cambiá la fecha, la hora o la duración y volvé a proponerla.</slot>
    </p>
  </div>
</template>

<style scoped>
.aviso-superposicion {
  border: 1px solid var(--color-error);
  border-radius: var(--radio);
  padding: 0.75rem 1rem;
  margin: 0.75rem 0;
}
.aviso-superposicion p {
  margin: 0.25rem 0;
}
</style>
