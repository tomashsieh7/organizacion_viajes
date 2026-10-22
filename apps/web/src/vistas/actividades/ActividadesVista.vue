<script setup lang="ts">
import IconoLinea from '../../componentes/base/IconoLinea.vue';
import { computed, onMounted, ref } from 'vue';
import type { AccionSobrePropuesta, ConflictoHorario, ValorVoto } from '@viajes/compartido';
import AvisoMensaje from '../../componentes/base/AvisoMensaje.vue';
import EstadoVacio from '../../componentes/base/EstadoVacio.vue';
import SiluetaCarga from '../../componentes/base/SiluetaCarga.vue';
import AvisoSuperposicion from '../../componentes/actividades/AvisoSuperposicion.vue';
import ListaAlternativas from '../../componentes/actividades/ListaAlternativas.vue';
import TarjetaActividad from '../../componentes/actividades/TarjetaActividad.vue';
import { ErrorDeApi, mensajeDeError } from '../../clientes/http';
import { useCarga } from '../../composables/useCarga';
import { useCelebracion } from '../../composables/useCelebracion';
import { usePropuestasStore } from '../../stores/propuestas';
import { useViajeStore } from '../../stores/viajes';
import { agruparOpciones } from '../../utiles/actividades';
import { NOMBRES_ESTADO } from '../../utiles/formato';

const viaje = useViajeStore();
const propuestas = usePropuestasStore();
const error = ref('');
const conflictos = ref<ConflictoHorario[]>([]);
const grupos = computed(() => agruparOpciones(propuestas.actividades));
/** Hasta la primera carga no se muestra la lista vacía. */
const {
  cargado,
  error: errorDeCarga,
  cargar,
  reintentar,
} = useCarga(() => propuestas.cargarActividades());

/** Hay un voto o una resolución en curso: un segundo clic no manda otro pedido. */
const ocupado = ref(false);

async function intentar(accion: () => Promise<void>) {
  if (ocupado.value) return;
  ocupado.value = true;
  error.value = '';
  conflictos.value = [];
  try {
    await accion();
  } catch (e) {
    // RN-R3: si al confirmar choca con otra confirmada, se muestra con qué.
    if (e instanceof ErrorDeApi && e.codigo === 'SUPERPOSICION_HORARIA') {
      conflictos.value = (e.detalles as { conflictos: ConflictoHorario[] }).conflictos;
    } else {
      error.value = mensajeDeError(e);
      // La propuesta cambió de estado mientras la lista estaba abierta: se muestra cómo quedó.
      if (e instanceof ErrorDeApi && e.estado === 409) {
        await propuestas.cargarActividades().catch(() => undefined);
      }
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
    const titulo = propuestas.actividades.find((a) => a.id === id)?.actividad.titulo;
    if (accion === 'confirmar' && titulo) celebrar(`¡Confirmaron ${titulo}!`);
  });

onMounted(cargar);
</script>

<template>
  <section>
    <div class="encabezado">
      <h2>Actividades</h2>
      <RouterLink
        class="boton boton--principal accion-flotante"
        :to="`/viajes/${viaje.actual!.id}/actividades/nueva`"
      >
        <IconoLinea nombre="mas" :tamano="20" /><span class="accion-flotante__texto"
          >Proponer actividad</span
        >
      </RouterLink>
    </div>
    <div class="filtro">
      <label for="filtro-estado-actividades">Mostrar</label>
      <select
        id="filtro-estado-actividades"
        v-model="propuestas.filtroActividades"
        @change="cargar"
      >
        <option value="">Todas</option>
        <option v-for="(nombre, estado) in NOMBRES_ESTADO" :key="estado" :value="estado">
          {{ nombre }}
        </option>
      </select>
    </div>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <AvisoSuperposicion v-if="conflictos.length" :conflictos="conflictos">
      Para confirmarla, primero hay que cancelar la actividad que ocupa ese horario.
    </AvisoSuperposicion>
    <SiluetaCarga v-if="!cargado" />
    <AvisoMensaje v-else-if="errorDeCarga" tipo="error" :reintentar="reintentar">{{
      errorDeCarga
    }}</AvisoMensaje>
    <template v-else-if="!error && !grupos.length">
      <EstadoVacio
        v-if="propuestas.filtroActividades"
        icono="🔎"
        titulo="No hay actividades con ese estado."
        descripcion="Probá mostrando todas."
      />
      <EstadoVacio
        v-else
        icono="🧭"
        titulo="Todavía no hay actividades propuestas."
        descripcion="Proponé qué hacer y cuándo; si a alguien se le ocurre otra cosa para ese momento, puede sumar una alternativa."
      >
        <RouterLink class="boton" :to="`/viajes/${viaje.actual!.id}/actividades/nueva`">
          Proponer la primera
        </RouterLink>
      </EstadoVacio>
    </template>
    <template v-for="g in grupos" :key="g.actividad.id">
      <TarjetaActividad
        :actividad="g.actividad"
        :soy-admin="viaje.soyAdmin"
        :moneda="viaje.actual!.moneda"
        :viaje-id="viaje.actual!.id"
        :ocupada="ocupado"
        mostrar-original
        @votar="votar"
        @desvotar="desvotar"
        @resolver="resolver"
      />
      <ListaAlternativas
        v-if="g.alternativas.length"
        :alternativas="g.alternativas"
        :soy-admin="viaje.soyAdmin"
        :moneda="viaje.actual!.moneda"
        :viaje-id="viaje.actual!.id"
        :ocupada="ocupado"
        @votar="votar"
        @desvotar="desvotar"
        @resolver="resolver"
      />
    </template>
  </section>
</template>

<style scoped>
.filtro {
  display: flex;
  align-items: center;
  gap: var(--esp-2);
  margin-bottom: var(--esp-4);
}
</style>
