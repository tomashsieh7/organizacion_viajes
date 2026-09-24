<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import AvisoSinActividades from '../componentes/itinerario/AvisoSinActividades.vue';
import MapaActividades from '../componentes/itinerario/MapaActividades.vue';
import PanelActividad from '../componentes/itinerario/PanelActividad.vue';
import SelectorDia from '../componentes/itinerario/SelectorDia.vue';
import { useMapaDelDia } from '../composables/useMapaDelDia';
import { useViajeStore } from '../stores/viaje';
import { diasEntre } from '../utiles/fechas';

const viaje = useViajeStore();
const route = useRoute();
const router = useRouter();
const actual = viaje.actual!;
const { mapa, elegida, error, cargar, elegir, abrirActividad } = useMapaDelDia(() => actual.id);

const dias = computed(() => diasEntre(actual.fechaInicio, actual.fechaFin));
const numeroElegida = computed(() => {
  const i = mapa.value?.actividades.findIndex((a) => a.id === elegida.value?.actividad.id) ?? -1;
  return i >= 0 ? i + 1 : null;
});
const parametro = (nombre: string) => {
  const valor = route.query[nombre];
  return typeof valor === 'string' ? valor : undefined;
};

function cerrarDetalle() {
  elegida.value = null;
}

/** RN-M7: el día queda en la dirección para poder compartirla o volver atrás. */
async function elegirDia(dia: string) {
  await router.replace({ query: { dia } });
  await cargar(dia);
}

onMounted(async () => {
  const actividad = parametro('actividad');
  if (actividad) await abrirActividad(actividad);
  else await cargar(parametro('dia'));
});
</script>

<template>
  <section>
    <h2>Mapa del día</h2>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <template v-if="mapa">
      <SelectorDia
        :dias="dias"
        :dias-con-actividad="mapa.diasConActividad"
        :seleccionado="mapa.dia"
        @elegir="elegirDia"
      />
      <AvisoSinActividades v-if="mapa.aviso === 'SIN_ACTIVIDADES_CONFIRMADAS'" />
      <MapaActividades
        :actividades="mapa.actividades"
        :recorrido="mapa.recorrido"
        :elegida-id="elegida?.actividad.id ?? null"
        @elegir="elegir"
      />
      <ol v-if="mapa.actividades.length" class="orden">
        <li v-for="a in mapa.actividades" :key="a.id">
          <button type="button" class="enlace" @click="elegir(a.id)">
            {{ a.horaInicio }} · {{ a.titulo }}
          </button>
        </li>
      </ol>
      <PanelActividad
        v-if="elegida"
        :actividad="elegida.actividad"
        :numero="numeroElegida"
        :confirmada="elegida.confirmada"
        @cerrar="cerrarDetalle"
      />
    </template>
    <p v-else-if="!error">Cargando…</p>
  </section>
</template>

<style scoped>
.orden {
  margin: 0.75rem 0 0;
  padding-left: 1.5rem;
}
.enlace {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-acento);
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
}
</style>
