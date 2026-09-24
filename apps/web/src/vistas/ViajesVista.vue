<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import DialogoNuevoViaje from '../componentes/viajes/DialogoNuevoViaje.vue';
import { mensajeDeError } from '../clientes/http';
import { useViajeStore } from '../stores/viaje';
import { formatearFecha } from '../utiles/formato';

const store = useViajeStore();
const router = useRouter();
const creando = ref(false);
const error = ref('');

onMounted(() => store.cargarViajes().catch((e) => (error.value = mensajeDeError(e))));
// El aviso se muestra una sola vez.
onBeforeUnmount(() => (store.aviso = ''));

function alCrear(viajeId: string) {
  creando.value = false;
  void router.push(`/viajes/${viajeId}`);
}
</script>

<template>
  <main class="pagina">
    <div class="encabezado">
      <h1>Mis grupos de viaje</h1>
      <button class="boton boton--principal" @click="creando = true">Nuevo grupo</button>
    </div>
    <AvisoMensaje v-if="store.aviso" tipo="info">{{ store.aviso }}</AvisoMensaje>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <p v-else-if="store.viajes.length === 0">Todavía no participás de ningún viaje.</p>
    <ul class="tarjetas">
      <li v-for="v in store.viajes" :key="v.id" class="tarjeta">
        <RouterLink
          :to="v.miAcceso === 'SOLO_SALDOS' ? `/viajes/${v.id}/saldos` : `/viajes/${v.id}`"
        >
          <strong>{{ v.nombre }}</strong>
          <span>{{ v.destino }}</span>
          <span>{{ formatearFecha(v.fechaInicio) }} al {{ formatearFecha(v.fechaFin) }}</span>
          <span v-if="v.miAcceso === 'SOLO_SALDOS'" class="etiqueta">Solo saldos</span>
          <span v-else-if="v.miRol === 'ADMIN'" class="etiqueta">Admin</span>
        </RouterLink>
      </li>
    </ul>
    <DialogoNuevoViaje v-if="creando" @cerrar="creando = false" @creado="alCrear" />
  </main>
</template>

<style scoped>
.tarjetas {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
}
.tarjeta a {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  color: inherit;
  text-decoration: none;
}
.tarjeta a:hover {
  border-color: var(--color-acento);
}
</style>
