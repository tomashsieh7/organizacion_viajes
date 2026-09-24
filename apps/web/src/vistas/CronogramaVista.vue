<script setup lang="ts">
import { inject, nextTick, onMounted, ref } from 'vue';
import type { Cronograma } from '@viajes/compartido';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import DiaCronograma from '../componentes/itinerario/DiaCronograma.vue';
import { CLIENTE_ITINERARIO } from '../clientes/itinerario';
import { mensajeDeError } from '../clientes/http';
import { useViajeStore } from '../stores/viaje';
import { hoyDelDispositivo } from '../utiles/fechas';

const cliente = inject(CLIENTE_ITINERARIO);
if (!cliente) throw new Error('Falta inyectar ClienteItinerario');
const viaje = useViajeStore();
const cronograma = ref<Cronograma | null>(null);
const error = ref('');
const hoy = hoyDelDispositivo();

onMounted(async () => {
  try {
    cronograma.value = await cliente.cronograma(viaje.actual!.id);
    // RN-C4: se desplaza hasta hoy si cae dentro del viaje.
    await nextTick();
    document.getElementById(`dia-${hoy}`)?.scrollIntoView({ block: 'start' });
  } catch (e) {
    error.value = mensajeDeError(e);
  }
});
</script>

<template>
  <section>
    <h2>Cronograma</h2>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <template v-else-if="cronograma">
      <DiaCronograma
        v-for="d in cronograma.dias"
        :key="d.fecha"
        :dia="d"
        :viaje-id="viaje.actual!.id"
        :es-hoy="d.fecha === hoy"
      />
    </template>
    <p v-else>Cargando…</p>
  </section>
</template>
