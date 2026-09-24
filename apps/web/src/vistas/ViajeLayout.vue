<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
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

const TODAS = [
  { nombre: 'Participantes', ruta: 'participantes' },
  { nombre: 'Alojamientos', ruta: 'alojamientos' },
  { nombre: 'Actividades', ruta: 'actividades' },
  { nombre: 'Cronograma', ruta: 'cronograma' },
  { nombre: 'Mapa', ruta: 'mapa' },
  { nombre: 'Chat', ruta: 'chat' },
  { nombre: 'Gastos', ruta: 'gastos' },
  { nombre: 'Saldos', ruta: 'saldos' },
];
const soloSaldos = computed(() => store.actual?.miAcceso === 'SOLO_SALDOS');
// RN-E6: con acceso solo a saldos, el menú muestra únicamente esa sección.
const secciones = computed(() =>
  soloSaldos.value ? TODAS.filter((s) => s.ruta === 'saldos') : TODAS,
);

/** Con acceso solo a saldos, cualquier otra sección lleva a la de saldos. */
async function exigirSeccionPermitida() {
  if (soloSaldos.value && store.actual && !/\/saldos(\/|$)/.test(route.path)) {
    await router.replace(`/viajes/${store.actual.id}/saldos`);
  }
}

watch(
  () => route.params['viajeId'],
  async (id) => {
    if (typeof id !== 'string') return;
    error.value = '';
    try {
      await store.abrir(id);
      await exigirSeccionPermitida();
      // La conexión en tiempo real acompaña al viaje abierto, en cualquier sección; quien solo
      // ve los saldos ya no está en el chat.
      if (!soloSaldos.value) await chat.entrar(id);
    } catch (e) {
      error.value = mensajeDeError(e);
    }
  },
  { immediate: true },
);
watch(() => route.path, exigirSeccionPermitida);

/**
 * RN-E4 y RN-E6: si la membresía termina mientras el viaje está abierto, se vuelve a la lista;
 * si le quedan saldos pendientes, se queda en la sección de saldos.
 */
watch(
  () => chat.finalizada,
  async (aviso) => {
    if (!aviso || !store.actual) return;
    const { id, nombre } = store.actual;
    const motivo =
      aviso.motivo === 'ELIMINADO'
        ? `El Admin te quitó de «${nombre}».`
        : `Saliste de «${nombre}».`;
    chat.desconectar();
    if (aviso.conservaAccesoSaldos) {
      await store.abrir(id);
      store.aviso = `${motivo} Podés seguir viendo tus saldos hasta que queden en cero.`;
      await router.push(`/viajes/${id}/saldos`);
      return;
    }
    await store.cerrarPorBaja(motivo);
    await router.push('/viajes');
  },
);

onBeforeUnmount(() => {
  chat.desconectar();
  store.aviso = '';
});
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
      <AvisoMensaje v-if="store.aviso" tipo="info">{{ store.aviso }}</AvisoMensaje>
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
