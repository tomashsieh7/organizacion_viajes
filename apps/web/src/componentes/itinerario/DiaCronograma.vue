<script setup lang="ts">
import { pasaLaMedianoche, type DiaDelCronograma } from '@viajes/compartido';
import { nombreDelDia } from '../../utiles/fechas';

defineProps<{ dia: DiaDelCronograma; viajeId: string; esHoy: boolean }>();

/** "22:00 a 01:00 del día siguiente" cuando la actividad pasa la medianoche. */
const horario = (a: DiaDelCronograma['actividades'][number]) =>
  `${a.horaInicio} a ${a.horaFin}${pasaLaMedianoche(a.horaInicio, a.duracionMin) ? ' del día siguiente' : ''}`;
</script>

<template>
  <section :id="`dia-${dia.fecha}`" class="dia" :class="{ hoy: esHoy }">
    <h3>{{ nombreDelDia(dia.fecha) }}<span v-if="esHoy" class="etiqueta-hoy"> · hoy</span></h3>
    <p v-if="!dia.actividades.length && !dia.siguenDelDiaAnterior.length" class="vacio">
      Sin actividades confirmadas
    </p>
    <ol v-else>
      <!-- RN-C2: lo que empezó el día anterior y sigue después de la medianoche. -->
      <li v-for="a in dia.siguenDelDiaAnterior" :key="`sigue-${a.id}`" class="sigue">
        <span class="horario">Hasta {{ a.horaFin }}</span> · <strong>{{ a.titulo }}</strong> ·
        {{ a.ubicacion }} · sigue del día anterior ·
        <RouterLink :to="`/viajes/${viajeId}/mapa?actividad=${a.id}`">Ver en el mapa</RouterLink>
      </li>
      <li v-for="a in dia.actividades" :key="a.id">
        <span class="horario">{{ horario(a) }}</span>
        · <strong>{{ a.titulo }}</strong> · {{ a.ubicacion }} ·
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
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-left: 4px solid var(--color-borde-fuerte);
  border-radius: var(--radio-grande);
  padding: var(--esp-3) var(--esp-4);
  margin-bottom: var(--esp-3);
  /* Al desplazarse hasta hoy, el día no queda tapado por el encabezado fijo. */
  scroll-margin-top: 5rem;
}
.dia.hoy {
  border-left-color: var(--color-acento);
  background: var(--color-acento-suave);
}
h3 {
  margin: 0 0 0.4rem;
}
/* "Viernes 11 dic": mayúscula solo al principio, el mes queda abreviado en minúscula. */
h3::first-letter {
  text-transform: uppercase;
}
ol {
  margin: 0;
  padding-left: 1.2rem;
}
li {
  margin-bottom: 0.3rem;
}
.sigue {
  color: var(--color-texto-secundario);
}
.horario {
  display: inline-block;
  min-width: 7rem;
}
.vacio {
  color: var(--color-texto-secundario);
  margin: 0;
}
.etiqueta-hoy {
  color: var(--color-acento);
}
.noche {
  margin: 0.4rem 0 0;
}
</style>
