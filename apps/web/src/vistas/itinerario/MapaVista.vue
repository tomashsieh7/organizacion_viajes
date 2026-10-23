<script setup lang="ts">
import SiluetaCarga from '../../componentes/base/SiluetaCarga.vue';
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AvisoMensaje from '../../componentes/base/AvisoMensaje.vue';
import AvisoSinActividades from '../../componentes/itinerario/AvisoSinActividades.vue';
import MapaActividades from '../../componentes/itinerario/MapaActividades.vue';
import PanelActividad from '../../componentes/itinerario/PanelActividad.vue';
import CalendarioViaje from '../../componentes/itinerario/CalendarioViaje.vue';
import { useMapaDelDia } from '../../composables/useMapaDelDia';
import { useViajeStore } from '../../stores/viajes';
import { hoyDelDispositivo } from '../../utiles/fechas';

const viaje = useViajeStore();
const route = useRoute();
const router = useRouter();
const actual = viaje.actual!;
const { mapa, elegida, error, cargar, elegir, abrirActividad } = useMapaDelDia(() => actual.id);

const hoy = hoyDelDispositivo();
const numeroElegida = computed(() => {
  const i = mapa.value?.actividades.findIndex((a) => a.id === elegida.value?.actividad.id) ?? -1;
  return i >= 0 ? i + 1 : null;
});
const parametro = (nombre: string) => {
  const valor = route.query[nombre];
  return typeof valor === 'string' ? valor : undefined;
};

/**
 * Abre la actividad de `?actividad=` (RN-M8) o el día de `?dia=`; sin ninguno, el que elige la API
 * (RN-M1). El día que quedó también va a la dirección.
 */
async function abrir() {
  const actividad = parametro('actividad');
  if (actividad) await abrirActividad(actividad);
  else await cargar(parametro('dia'));
  if (mapa.value && parametro('dia') !== mapa.value.dia)
    await router.replace({ query: { ...route.query, dia: mapa.value.dia } });
}

/** Si el mapa no llegó a cargar, se vuelve a pedir lo mismo, incluida la actividad. */
const reintentar = computed(() => (mapa.value ? undefined : abrir));

/** La actividad abierta que no está confirmada se ubica aparte, fuera del recorrido (RN-M8). */
const fueraDelRecorrido = computed(() =>
  elegida.value && !elegida.value.confirmada ? elegida.value.actividad : null,
);

function cerrarDetalle() {
  elegida.value = null;
}

/**
 * RN-M7: el día queda en la dirección para poder compartirla, volver atrás y conservarlo al pasar
 * al cronograma.
 */
async function elegirDia(dia: string) {
  await router.replace({ query: { dia } });
  await cargar(dia);
}

/** RN-M9: abre en su día la actividad que sigue del día anterior. */
async function verQueSigue(id: string) {
  await abrirActividad(id);
  if (mapa.value) await router.replace({ query: { actividad: id, dia: mapa.value.dia } });
}

onMounted(abrir);
</script>

<template>
  <section>
    <h2>Mapa del día</h2>
    <AvisoMensaje v-if="error" tipo="error" :reintentar="reintentar">{{ error }}</AvisoMensaje>
    <!-- En escritorio, el calendario y la lista del día van a la izquierda y el mapa a la derecha. -->
    <div v-if="mapa" class="mapa-dia">
      <div class="mapa-dia__elegir">
        <CalendarioViaje
          :inicio="actual.fechaInicio"
          :fin="actual.fechaFin"
          :seleccionado="mapa.dia"
          :dias-con-actividad="mapa.diasConActividad"
          :hoy="hoy"
          @elegir="elegirDia"
        />
        <ul v-if="mapa.siguenDelDiaAnterior.length" class="siguen">
          <!-- RN-M9: lo que empezó el día anterior y sigue después de la medianoche. -->
          <li v-for="a in mapa.siguenDelDiaAnterior" :key="a.id">
            Hasta {{ a.horaFin }} · <strong>{{ a.titulo }}</strong> · {{ a.ubicacion }} · sigue del
            día anterior ·
            <button type="button" class="enlace" @click="verQueSigue(a.id)">Ver en el mapa</button>
          </li>
        </ul>
        <AvisoSinActividades v-if="mapa.aviso === 'SIN_ACTIVIDADES_CONFIRMADAS'" />
      </div>
      <MapaActividades
        class="mapa-dia__mapa"
        :actividades="mapa.actividades"
        :recorrido="mapa.recorrido"
        :elegida-id="elegida?.actividad.id ?? null"
        :fuera-del-recorrido="fueraDelRecorrido"
        @elegir="elegir"
      />
      <div class="mapa-dia__detalle">
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
      </div>
    </div>
    <SiluetaCarga v-else-if="!error" :cantidad="2" />
  </section>
</template>

<style scoped>
@media (min-width: 64rem) {
  .mapa-dia {
    display: grid;
    grid-template-columns: 22rem minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'elegir mapa'
      'detalle mapa';
    column-gap: var(--esp-4);
    align-items: start;
  }
  .mapa-dia__elegir {
    grid-area: elegir;
  }
  .mapa-dia__mapa {
    grid-area: mapa;
  }
  .mapa-dia__detalle {
    grid-area: detalle;
  }
}
.orden {
  margin: 0.75rem 0 0;
  padding-left: 1.5rem;
}
.siguen {
  list-style: none;
  margin: 0.75rem 0;
  padding: 0;
}
.enlace {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-acento);
  cursor: pointer;
  font: inherit;
  text-align: left;
  text-decoration: underline;
}
</style>
