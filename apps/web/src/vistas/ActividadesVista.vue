<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { AccionSobrePropuesta, ConflictoHorario, ValorVoto } from '@viajes/compartido';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import AvisoSuperposicion from '../componentes/actividades/AvisoSuperposicion.vue';
import ListaAlternativas from '../componentes/actividades/ListaAlternativas.vue';
import TarjetaActividad from '../componentes/actividades/TarjetaActividad.vue';
import { ErrorDeApi, mensajeDeError } from '../clientes/http';
import { usePropuestasStore } from '../stores/propuestas';
import { useViajeStore } from '../stores/viaje';
import { agruparOpciones } from '../utiles/actividades';
import { NOMBRES_ESTADO } from '../utiles/formato';

const viaje = useViajeStore();
const propuestas = usePropuestasStore();
const error = ref('');
const conflictos = ref<ConflictoHorario[]>([]);
const grupos = computed(() => agruparOpciones(propuestas.actividades));

async function intentar(accion: () => Promise<void>) {
  error.value = '';
  conflictos.value = [];
  try {
    await accion();
  } catch (e) {
    // RN-R3: si al confirmar choca con otra confirmada, se muestra con qué.
    if (e instanceof ErrorDeApi && e.codigo === 'SUPERPOSICION_HORARIA') {
      conflictos.value = (e.detalles as { conflictos: ConflictoHorario[] }).conflictos;
    } else error.value = mensajeDeError(e);
  }
}

const cargar = () => intentar(() => propuestas.cargarActividades());
const votar = (id: string, valor: ValorVoto) => intentar(() => propuestas.votar(id, valor));
const desvotar = (id: string) => intentar(() => propuestas.desvotar(id));
const resolver = (id: string, accion: AccionSobrePropuesta) =>
  intentar(() => propuestas.resolver(id, accion));

onMounted(cargar);
</script>

<template>
  <section>
    <div class="encabezado">
      <h2>Actividades</h2>
      <RouterLink
        class="boton boton--principal"
        :to="`/viajes/${viaje.actual!.id}/actividades/nueva`"
      >
        Proponer actividad
      </RouterLink>
    </div>
    <label for="filtro-estado-actividades">Mostrar</label>
    <select id="filtro-estado-actividades" v-model="propuestas.filtroActividades" @change="cargar">
      <option value="">Todas</option>
      <option v-for="(nombre, estado) in NOMBRES_ESTADO" :key="estado" :value="estado">
        {{ nombre }}
      </option>
    </select>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <AvisoSuperposicion v-if="conflictos.length" :conflictos="conflictos">
      Para confirmarla, primero hay que cancelar la actividad que ocupa ese horario.
    </AvisoSuperposicion>
    <p v-if="!grupos.length">Todavía no hay actividades propuestas.</p>
    <template v-for="g in grupos" :key="g.actividad.id">
      <TarjetaActividad
        :actividad="g.actividad"
        :soy-admin="viaje.soyAdmin"
        :moneda="viaje.actual!.moneda"
        :viaje-id="viaje.actual!.id"
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
        @votar="votar"
        @desvotar="desvotar"
        @resolver="resolver"
      />
    </template>
  </section>
</template>

<style scoped>
#filtro-estado-actividades {
  margin: 0 0 1rem 0.5rem;
}
</style>
