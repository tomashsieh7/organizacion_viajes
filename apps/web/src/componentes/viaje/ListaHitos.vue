<script setup lang="ts">
import IconoLinea from '../base/IconoLinea.vue';
import type { ClaveHito, Hito } from '../../utiles/progreso';

/** Hitos del viaje: los cumplidos con tilde; los pendientes, con su avance y dónde resolverlos. */
defineProps<{
  hitos: Hito[];
  enlaces: Partial<Record<ClaveHito, { ruta: string; texto: string }>>;
}>();
</script>

<template>
  <ul class="hitos">
    <li v-for="h in hitos" :key="h.clave" class="hito" :class="h.hecho ? 'hecho' : 'pendiente'">
      <span class="hito__marca">
        <IconoLinea v-if="h.hecho" nombre="check" :tamano="16" />
        <template v-else>{{ h.fraccion }}</template>
      </span>
      <span class="hito__texto">
        {{ h.titulo }}
        <span class="solo-lectores">{{ h.hecho ? '(cumplido)' : '(pendiente)' }}</span>
        <span v-if="h.detalle" class="hito__detalle">{{ h.detalle }}</span>
        <span v-if="!h.hecho && h.fraccion" class="barrita" aria-hidden="true"
          ><span :style="{ width: `${Math.round(h.avance * 100)}%` }"
        /></span>
      </span>
      <RouterLink
        v-if="!h.hecho && enlaces[h.clave]"
        :to="enlaces[h.clave]!.ruta"
        class="hito__enlace"
      >
        {{ enlaces[h.clave]!.texto }}
      </RouterLink>
    </li>
  </ul>
</template>

<style scoped>
.hitos {
  list-style: none;
  padding: 0;
  margin: var(--esp-4) 0 0;
  display: grid;
  gap: var(--esp-2);
}
.hito {
  display: flex;
  gap: var(--esp-3);
  align-items: center;
  padding: var(--esp-2) var(--esp-3);
  border-radius: var(--radio);
  background: var(--color-superficie-alt);
}
.hito__marca {
  flex: none;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 var(--esp-1);
  display: grid;
  place-content: center;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
}
.hecho .hito__marca {
  background: var(--color-acento);
  color: var(--color-sobre-acento);
}
.pendiente .hito__marca {
  background: var(--color-superficie);
  color: var(--color-texto-secundario);
  border: 2px solid var(--color-borde);
}
.hito__texto {
  flex: 1;
}
.hito__detalle {
  display: block;
  font-size: 0.875rem;
  color: var(--color-texto-secundario);
}
.barrita {
  display: block;
  height: 6px;
  margin-top: var(--esp-1);
  border-radius: 999px;
  background: var(--color-borde);
  overflow: hidden;
}
.barrita span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--color-acento);
}
.hito__enlace {
  font-weight: 700;
  white-space: nowrap;
}
</style>
