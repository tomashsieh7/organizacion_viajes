<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { AccionSobrePropuesta, ValorVoto } from '@viajes/compartido';
import AvisoMensaje from '../../componentes/base/AvisoMensaje.vue';
import EstadoVacio from '../../componentes/base/EstadoVacio.vue';
import IconoLinea from '../../componentes/base/IconoLinea.vue';
import SiluetaCarga from '../../componentes/base/SiluetaCarga.vue';
import TarjetaPropuesta from '../../componentes/propuestas/TarjetaPropuesta.vue';
import { ErrorDeApi, mensajeDeError } from '../../clientes/http';
import { useCarga } from '../../composables/useCarga';
import { useCelebracion } from '../../composables/useCelebracion';
import { usePropuestasStore } from '../../stores/propuestas';
import { useViajeStore } from '../../stores/viajes';
import { diasEntre } from '../../utiles/fechas';
import { formatearRango, NOMBRES_ESTADO } from '../../utiles/formato';

const viaje = useViajeStore();
const propuestas = usePropuestasStore();
/** Errores de votar y resolver; los de la carga los maneja `useCarga`. */
const error = ref('');
/** Hasta la primera carga no se muestra la lista vacía. */
const {
  cargado,
  error: errorDeCarga,
  cargar,
  reintentar,
} = useCarga(() => propuestas.cargarAlojamientos());

/** Noches de la estadía: el día de salida no cuenta (RN-C3). */
function noches(desde: string, hasta: string): string {
  const n = diasEntre(desde, hasta).length - 1;
  return n === 1 ? '1 noche' : `${n} noches`;
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
    // La propuesta cambió de estado mientras la lista estaba abierta: se muestra cómo quedó.
    if (e instanceof ErrorDeApi && e.estado === 409) {
      await propuestas.cargarAlojamientos().catch(() => undefined);
    }
  } finally {
    ocupado.value = false;
  }
}

const votar = (id: string, valor: ValorVoto) => intentar(() => propuestas.votar(id, valor));
const desvotar = (id: string) => intentar(() => propuestas.desvotar(id));
const { celebrar } = useCelebracion();
const resolver = (id: string, accion: AccionSobrePropuesta) =>
  intentar(async () => {
    await propuestas.resolver(id, accion);
    const nombre = propuestas.alojamientos.find((a) => a.id === id)?.alojamiento.nombre;
    if (accion === 'confirmar' && nombre) celebrar(`¡Confirmaron ${nombre}!`);
  });

onMounted(cargar);
</script>

<template>
  <section>
    <div class="encabezado">
      <h2>Alojamientos</h2>
      <RouterLink
        class="boton boton--principal accion-flotante"
        :to="`/viajes/${viaje.actual!.id}/alojamientos/nuevo`"
      >
        <IconoLinea nombre="mas" :tamano="20" /><span class="accion-flotante__texto"
          >Proponer alojamiento</span
        >
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
    <AvisoMensaje v-else-if="errorDeCarga" tipo="error" :reintentar="reintentar">{{
      errorDeCarga
    }}</AvisoMensaje>
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
        <IconoLinea nombre="calendario" :tamano="16" />
        {{ formatearRango(a.alojamiento.fechaDesde, a.alojamiento.fechaHasta) }} ·
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
