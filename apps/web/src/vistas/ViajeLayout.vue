<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import { mensajeDeError } from '../clientes/http';
import { useChatStore } from '../stores/chat';
import { useViajeStore } from '../stores/viaje';
import { formatearFecha } from '../utiles/formato';

const store = useViajeStore();
const chat = useChatStore();
const route = useRoute();
const router = useRouter();
const error = ref('');

// Las demás secciones del menú se suman en las fases siguientes (F7 y F8).
const secciones = [
  { nombre: 'Participantes', ruta: 'participantes' },
  { nombre: 'Alojamientos', ruta: 'alojamientos' },
  { nombre: 'Actividades', ruta: 'actividades' },
  { nombre: 'Cronograma', ruta: 'cronograma' },
  { nombre: 'Mapa', ruta: 'mapa' },
  { nombre: 'Chat', ruta: 'chat' },
];

watch(
  () => route.params['viajeId'],
  async (id) => {
    if (typeof id !== 'string') return;
    error.value = '';
    try {
      await store.abrir(id);
      // La conexión en tiempo real acompaña al viaje abierto, en cualquier sección.
      await chat.entrar(id);
    } catch (e) {
      error.value = mensajeDeError(e);
    }
  },
  { immediate: true },
);

/** RN-E4: si la membresía termina mientras el viaje está abierto, se vuelve a la lista. */
watch(
  () => chat.finalizada,
  async (aviso) => {
    if (!aviso || !store.actual) return;
    const nombre = store.actual.nombre;
    const motivo =
      aviso.motivo === 'ELIMINADO'
        ? `El Admin te quitó de «${nombre}».`
        : `Saliste de «${nombre}».`;
    const saldos = aviso.conservaAccesoSaldos
      ? ' Todavía tenés saldos pendientes en ese viaje.'
      : '';
    chat.desconectar();
    await store.cerrarPorBaja(motivo + saldos);
    await router.push('/viajes');
  },
);

onBeforeUnmount(() => chat.desconectar());
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
