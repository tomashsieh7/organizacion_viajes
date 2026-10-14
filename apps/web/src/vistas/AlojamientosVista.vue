<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { AccionSobrePropuesta, ValorVoto } from '@viajes/compartido';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import EstadoVacio from '../componentes/base/EstadoVacio.vue';
import SiluetaCarga from '../componentes/base/SiluetaCarga.vue';
import TarjetaPropuesta from '../componentes/propuestas/TarjetaPropuesta.vue';
import { mensajeDeError } from '../clientes/http';
import { usePropuestasStore } from '../stores/propuestas';
import { useViajeStore } from '../stores/viaje';
import { diasEntre } from '../utiles/fechas';
import { formatearRango, NOMBRES_ESTADO } from '../utiles/formato';

const viaje = useViajeStore();
const propuestas = usePropuestasStore();
const error = ref('');
/** Hasta la primera carga no se muestra la lista vacía. */
const cargado = ref(false);

/** Noches de la estadía: el día de salida no cuenta (RN-C3). */
function noches(desde: string, hasta: string): string {
  const n = diasEntre(desde, hasta).length - 1;
  return n === 1 ? '1 noche' : `${n} noches`;
}

async function cargar() {
  error.value = '';
  try {
    await propuestas.cargarAlojamientos();
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    cargado.value = true;
  }
}

/** Hay un voto o una resolución en curso: un segundo clic no manda otro pedido. */
const ocupado = ref(false);

async function intentar(accion: () => Promise<void>) {
  if (ocupado.value) return;
  ocupado.value = true;
  error.value = '';
  try {
    await accion();
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    ocupado.value = false;
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
    <div class="filtro">
      <label for="filtro-estado">Mostrar</label>
      <select id="filtro-estado" v-model="propuestas.filtro" @change="cargar">
        <option value="">Todos</option>
        <option v-for="(nombre, estado) in NOMBRES_ESTADO" :key="estado" :value="estado">
          {{ nombre }}
        </option>
      </select>
    </div>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <SiluetaCarga v-if="!cargado" />
    <template v-else-if="!error && !propuestas.alojamientos.length">
      <EstadoVacio
        v-if="propuestas.filtro"
        icono="🔎"
        titulo="No hay alojamientos con ese estado."
        descripcion="Probá mostrando todos."
      />
      <EstadoVacio
        v-else
        icono="🏨"
        titulo="Todavía no hay alojamientos propuestos."
        descripcion="Proponé dónde dormir y el grupo vota; el Admin confirma el elegido."
      >
        <RouterLink class="boton" :to="`/viajes/${viaje.actual!.id}/alojamientos/nuevo`">
          Proponer el primero
        </RouterLink>
      </EstadoVacio>
    </template>
    <TarjetaPropuesta
      v-for="a in propuestas.alojamientos"
      :key="a.id"
      :propuesta="a"
      :titulo="a.alojamiento.nombre"
      :soy-admin="viaje.soyAdmin"
      :moneda="viaje.actual!.moneda"
      :ocupada="ocupado"
      @votar="votar(a.id, $event)"
      @desvotar="desvotar(a.id)"
      @resolver="resolver(a.id, $event)"
    >
      <p class="fechas">
        <span aria-hidden="true">📅 </span
        >{{ formatearRango(a.alojamiento.fechaDesde, a.alojamiento.fechaHasta) }} ·
        {{ noches(a.alojamiento.fechaDesde, a.alojamiento.fechaHasta) }}
      </p>
    </TarjetaPropuesta>
  </section>
</template>

<style scoped>
.fechas {
  margin: 0 0 var(--esp-2);
}
.filtro {
  display: flex;
  align-items: center;
  gap: var(--esp-2);
  margin-bottom: var(--esp-4);
}
</style>
