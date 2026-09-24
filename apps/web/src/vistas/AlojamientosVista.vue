<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { AccionSobrePropuesta, ValorVoto } from '@viajes/compartido';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import TarjetaPropuesta from '../componentes/propuestas/TarjetaPropuesta.vue';
import { mensajeDeError } from '../clientes/http';
import { usePropuestasStore } from '../stores/propuestas';
import { useViajeStore } from '../stores/viaje';
import { formatearFecha, NOMBRES_ESTADO } from '../utiles/formato';

const viaje = useViajeStore();
const propuestas = usePropuestasStore();
const error = ref('');

async function cargar() {
  error.value = '';
  try {
    await propuestas.cargarAlojamientos();
  } catch (e) {
    error.value = mensajeDeError(e);
  }
}

async function intentar(accion: () => Promise<void>) {
  error.value = '';
  try {
    await accion();
  } catch (e) {
    error.value = mensajeDeError(e);
  }
}

const votar = (id: string, valor: ValorVoto) => intentar(() => propuestas.votar(id, valor));
const desvotar = (id: string) => intentar(() => propuestas.desvotar(id));
const resolver = (id: string, accion: AccionSobrePropuesta) =>
  intentar(() => propuestas.resolver(id, accion));

onMounted(cargar);
</script>

<template>
  <section>
    <div class="encabezado">
      <h2>Alojamientos</h2>
      <RouterLink
        class="boton boton--principal"
        :to="`/viajes/${viaje.actual!.id}/alojamientos/nuevo`"
      >
        Proponer alojamiento
      </RouterLink>
    </div>
    <label for="filtro-estado">Mostrar</label>
    <select id="filtro-estado" v-model="propuestas.filtro" @change="cargar">
      <option value="">Todos</option>
      <option v-for="(nombre, estado) in NOMBRES_ESTADO" :key="estado" :value="estado">
        {{ nombre }}
      </option>
    </select>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <p v-if="!propuestas.alojamientos.length">Todavía no hay alojamientos propuestos.</p>
    <TarjetaPropuesta
      v-for="a in propuestas.alojamientos"
      :key="a.id"
      :propuesta="a"
      :titulo="a.alojamiento.nombre"
      :soy-admin="viaje.soyAdmin"
      :moneda="viaje.actual!.moneda"
      @votar="votar(a.id, $event)"
      @desvotar="desvotar(a.id)"
      @resolver="resolver(a.id, $event)"
    >
      <p class="fechas">
        Entrada {{ formatearFecha(a.alojamiento.fechaDesde) }} · salida
        {{ formatearFecha(a.alojamiento.fechaHasta) }}
      </p>
    </TarjetaPropuesta>
  </section>
</template>

<style scoped>
.fechas {
  margin: 0.25rem 0 0;
}
#filtro-estado {
  margin: 0 0 1rem 0.5rem;
}
</style>
