<script setup lang="ts">
import type { PropuestaFueraDeFechas } from '@viajes/compartido';
import IconoLinea from '../base/IconoLinea.vue';
import { nombreDelDia } from '../../utiles/fechas';
import { formatearRango } from '../../utiles/formato';

/**
 * RN-V3: propuestas pendientes o confirmadas que quedarían fuera de las fechas nuevas. Primero se
 * lee cuántas son y, al desplegar, cuáles, con un enlace a cada una para resolverla.
 */
const props = defineProps<{ propuestas: PropuestaFueraDeFechas[]; viajeId: string }>();

const enlace = (p: PropuestaFueraDeFechas) =>
  p.tipo === 'ACTIVIDAD'
    ? `/viajes/${props.viajeId}/actividades?dia=${p.desde}`
    : `/viajes/${props.viajeId}/alojamientos`;
const cuando = (p: PropuestaFueraDeFechas) =>
  p.tipo === 'ACTIVIDAD' ? nombreDelDia(p.desde) : formatearRango(p.desde, p.hasta);
</script>

<template>
  <div class="afuera" role="status">
    <p class="afuera__cantidad">
      Quedan afuera
      <strong
        >{{ propuestas.length }} {{ propuestas.length === 1 ? 'propuesta' : 'propuestas' }}</strong
      >.
    </p>
    <details>
      <summary>Ver cuáles</summary>
      <ul class="afuera__lista">
        <li v-for="p in propuestas" :key="p.id">
          <RouterLink :to="enlace(p)" class="afuera__fila">
            <IconoLinea :nombre="p.tipo === 'ALOJAMIENTO' ? 'cama' : 'votar'" :tamano="16" />
            <span class="afuera__titulo">{{ p.titulo }}</span>
            <span class="afuera__cuando texto-secundario">{{ cuando(p) }}</span>
          </RouterLink>
        </li>
      </ul>
    </details>
  </div>
</template>

<style scoped>
.afuera {
  padding: var(--esp-2) var(--esp-3);
  border: 1px solid var(--color-error);
  border-radius: var(--radio);
  background: var(--color-error-suave);
}
.afuera__cantidad {
  margin: 0;
}
summary {
  margin-top: var(--esp-1);
  color: var(--color-acento);
  font-weight: 600;
  cursor: pointer;
}
.afuera__lista {
  display: grid;
  gap: 2px;
  margin: var(--esp-2) 0 0;
  padding: 0;
  list-style: none;
}
.afuera__fila {
  display: flex;
  align-items: center;
  gap: var(--esp-2);
  min-height: 2.25rem;
  color: var(--color-texto);
  text-decoration: none;
}
.afuera__titulo {
  flex: 1;
  min-width: 0;
  text-decoration: underline;
}
.afuera__cuando {
  flex: none;
  font-size: 0.875rem;
  white-space: nowrap;
}
</style>
