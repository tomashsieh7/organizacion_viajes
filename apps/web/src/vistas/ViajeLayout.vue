<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import { mensajeDeError } from '../clientes/http';
import { useViajeStore } from '../stores/viaje';
import { formatearFecha } from '../utiles/formato';

const store = useViajeStore();
const route = useRoute();
const error = ref('');

// Las demás secciones del menú se suman en las fases siguientes (F6 a F8).
const secciones = [
  { nombre: 'Participantes', ruta: 'participantes' },
  { nombre: 'Alojamientos', ruta: 'alojamientos' },
  { nombre: 'Actividades', ruta: 'actividades' },
  { nombre: 'Cronograma', ruta: 'cronograma' },
  { nombre: 'Mapa', ruta: 'mapa' },
];

watch(
  () => route.params['viajeId'],
  async (id) => {
    if (typeof id !== 'string') return;
    error.value = '';
    try {
      await store.abrir(id);
    } catch (e) {
      error.value = mensajeDeError(e);
    }
  },
  { immediate: true },
);
</script>

<template>
  <main class="pagina">
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <template v-else-if="store.actual">
      <header class="viaje">
        <RouterLink to="/viajes">← Mis grupos</RouterLink>
        <h1>{{ store.actual.nombre }}</h1>
        <p>
          {{ store.actual.destino }} · {{ formatearFecha(store.actual.fechaInicio) }} al
          {{ formatearFecha(store.actual.fechaFin) }}
        </p>
        <nav>
          <RouterLink
            v-for="s in secciones"
            :key="s.ruta"
            :to="`/viajes/${store.actual.id}/${s.ruta}`"
            >{{ s.nombre }}</RouterLink
          >
        </nav>
      </header>
      <RouterView />
    </template>
    <p v-else>Cargando…</p>
  </main>
</template>

<style scoped>
.viaje nav {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--color-borde);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
.viaje nav .router-link-active {
  font-weight: bold;
}
</style>
