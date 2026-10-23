<script setup lang="ts">
import SiluetaCarga from '../../componentes/base/SiluetaCarga.vue';
import { computed, inject, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Cronograma } from '@viajes/compartido';
import AvisoMensaje from '../../componentes/base/AvisoMensaje.vue';
import CalendarioViaje from '../../componentes/itinerario/CalendarioViaje.vue';
import DiaCronograma from '../../componentes/itinerario/DiaCronograma.vue';
import { CLIENTE_ITINERARIO } from '../../clientes/itinerario';
import { useCarga } from '../../composables/useCarga';
import { useViajeStore } from '../../stores/viajes';
import { diaInicial, hoyDelDispositivo } from '../../utiles/fechas';

const cliente = inject(CLIENTE_ITINERARIO);
if (!cliente) throw new Error('Falta inyectar ClienteItinerario');
const viaje = useViajeStore();
const route = useRoute();
const router = useRouter();
const actual = viaje.actual!;
const cronograma = ref<Cronograma | null>(null);
const hoy = hoyDelDispositivo();

const diasConActividad = computed(
  () => cronograma.value?.dias.filter((d) => d.actividades.length).map((d) => d.fecha) ?? [],
);
/**
 * RN-C1 y RN-C4: el calendario muestra todos los días del viaje y abre en hoy (con la regla de
 * RN-M1). El día elegido va en `?dia=`, que comparte con el mapa al cambiar de pestaña.
 */
const elegido = computed(() => {
  const dias = cronograma.value?.dias.map((d) => d.fecha) ?? [];
  const pedido = route.query['dia'];
  if (typeof pedido === 'string' && dias.includes(pedido)) return pedido;
  return dias.length ? diaInicial(dias, diasConActividad.value, hoy) : null;
});
const dia = computed(() => cronograma.value?.dias.find((d) => d.fecha === elegido.value));

async function elegir(fecha: string) {
  await router.replace({ query: { dia: fecha } });
}

const { error, cargar, reintentar } = useCarga(async () => {
  cronograma.value = await cliente.cronograma(actual.id);
  // El día que se abrió también va a la dirección, para conservarlo al pasar al mapa.
  if (elegido.value && route.query['dia'] !== elegido.value) await elegir(elegido.value);
});
onMounted(cargar);
</script>

<template>
  <section>
    <h2>Cronograma</h2>
    <AvisoMensaje v-if="error" tipo="error" :reintentar="reintentar">{{ error }}</AvisoMensaje>
    <div v-else-if="cronograma" class="grilla grilla--lateral">
      <CalendarioViaje
        :inicio="actual.fechaInicio"
        :fin="actual.fechaFin"
        :seleccionado="elegido"
        :dias-con-actividad="diasConActividad"
        :hoy="hoy"
        @elegir="elegir"
      />
      <DiaCronograma v-if="dia" :dia="dia" :viaje-id="actual.id" :es-hoy="dia.fecha === hoy" />
    </div>
    <SiluetaCarga v-else :cantidad="2" />
  </section>
</template>
