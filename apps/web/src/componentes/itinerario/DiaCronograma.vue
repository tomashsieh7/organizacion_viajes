<script setup lang="ts">
import type { DiaDelCronograma } from '@viajes/compartido';
import { nombreDelDia } from '../../utiles/fechas';

defineProps<{ dia: DiaDelCronograma; viajeId: string; esHoy: boolean }>();
</script>

<template>
  <section :id="`dia-${dia.fecha}`" class="dia" :class="{ hoy: esHoy }">
    <h3>{{ nombreDelDia(dia.fecha) }}<span v-if="esHoy" class="etiqueta-hoy"> · hoy</span></h3>
    <p v-if="!dia.actividades.length" class="vacio">Sin actividades confirmadas</p>
    <ol v-else>
      <li v-for="a in dia.actividades" :key="a.id">
        <span class="horario">{{ a.horaInicio }} a {{ a.horaFin }}</span>
        <strong>{{ a.titulo }}</strong> · {{ a.ubicacion }} ·
        <RouterLink :to="`/viajes/${viajeId}/mapa?actividad=${a.id}`">Ver en el mapa</RouterLink>
      </li>
    </ol>
    <p v-for="al in dia.alojamientos" :key="al.id" class="noche">
      Noche en <strong>{{ al.nombre }}</strong> ({{ al.ubicacion }})
    </p>
  </section>
</template>

<style scoped>
.dia {
  border-left: 3px solid var(--color-borde);
  padding: 0.25rem 0 0.5rem 1rem;
  margin-bottom: 1rem;
  scroll-margin-top: 1rem;
}
.dia.hoy {
  border-left-color: var(--color-acento);
}
h3 {
  margin: 0 0 0.4rem;
  text-transform: capitalize;
}
ol {
  margin: 0;
  padding-left: 1.2rem;
}
li {
  margin-bottom: 0.3rem;
}
.horario {
  display: inline-block;
  min-width: 7rem;
}
.vacio {
  color: #57606a;
  margin: 0;
}
.noche {
  margin: 0.4rem 0 0;
}
</style>
