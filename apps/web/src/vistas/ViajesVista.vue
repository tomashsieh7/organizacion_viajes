<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import EstadoVacio from '../componentes/base/EstadoVacio.vue';
import IconoLinea from '../componentes/base/IconoLinea.vue';
import SiluetaCarga from '../componentes/base/SiluetaCarga.vue';
import DialogoNuevoViaje from '../componentes/viajes/DialogoNuevoViaje.vue';
import { useCarga } from '../composables/useCarga';
import { useViajeStore } from '../stores/viaje';
import { hoyDelDispositivo } from '../utiles/fechas';
import { formatearRango } from '../utiles/formato';
import { cuentaRegresiva } from '../utiles/progreso';

const store = useViajeStore();
const router = useRouter();
const creando = ref(false);
/** Hasta la primera carga no se muestra la lista vacía. */
const { cargado, error, cargar, reintentar } = useCarga(() => store.cargarViajes());
const hoy = hoyDelDispositivo();

/**
 * Primero los viajes en curso y los próximos, en el orden de la API (por fecha de inicio); al final
 * los terminados, del más reciente al más viejo, así el viaje que se organiza queda arriba.
 */
const viajes = computed(() => {
  const terminados = store.viajes
    .filter((v) => v.fechaFin < hoy)
    .sort((a, b) => b.fechaFin.localeCompare(a.fechaFin));
  return [...store.viajes.filter((v) => v.fechaFin >= hoy), ...terminados];
});

onMounted(cargar);
// El aviso se muestra una sola vez.
onBeforeUnmount(() => (store.avisoLista = ''));

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
    <AvisoMensaje v-if="store.avisoLista" tipo="info">{{ store.avisoLista }}</AvisoMensaje>
    <SiluetaCarga v-if="!cargado" :cantidad="2" />
    <AvisoMensaje v-else-if="error" tipo="error" :reintentar="reintentar">{{ error }}</AvisoMensaje>
    <EstadoVacio
      v-else-if="store.viajes.length === 0"
      icono="🧳"
      titulo="Todavía no participás de ningún viaje."
      descripcion="Creá un grupo para organizar un viaje, o pedile a quien administra uno que te agregue con tu email."
    >
      <button class="boton" type="button" @click="creando = true">Crear mi primer grupo</button>
    </EstadoVacio>
    <ul class="tarjetas">
      <li v-for="v in viajes" :key="v.id" class="tarjeta">
        <RouterLink
          class="panel"
          :to="v.miAcceso === 'SOLO_SALDOS' ? `/viajes/${v.id}/saldos` : `/viajes/${v.id}`"
        >
          <span class="tarjeta__titulo">
            <strong>{{ v.nombre }}</strong>
            <span v-if="v.miAcceso === 'SOLO_SALDOS'" class="etiqueta">Solo saldos</span>
            <span v-else-if="v.miRol === 'ADMIN'" class="etiqueta">Admin</span>
          </span>
          <span class="texto-secundario"
            ><IconoLinea nombre="pin" :tamano="16" /> {{ v.destino }}</span
          >
          <span class="texto-secundario"
            ><IconoLinea nombre="calendario" :tamano="16" />
            {{ formatearRango(v.fechaInicio, v.fechaFin) }}</span
          >
          <span class="tarjeta__cuenta"
            ><IconoLinea nombre="reloj" :tamano="16" />
            {{ cuentaRegresiva(v.fechaInicio, v.fechaFin, hoy).texto }}</span
          >
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
  margin: 0;
  display: grid;
  gap: var(--esp-3);
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
}
.tarjeta a {
  display: flex;
  flex-direction: column;
  gap: var(--esp-1);
  color: inherit;
  text-decoration: none;
  transition:
    border-color var(--duracion),
    box-shadow var(--duracion);
}
.tarjeta a:hover {
  border-color: var(--color-acento);
  box-shadow: var(--sombra-elevada);
}
.tarjeta a {
  border-top: 4px solid var(--color-acento);
}
.tarjeta__cuenta {
  margin-top: var(--esp-1);
  font-weight: 700;
  color: var(--color-acento);
}
.tarjeta__titulo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--esp-2);
  font-size: 1.0625rem;
}
</style>
