<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import FilaSaldo from '../componentes/gastos/FilaSaldo.vue';
import { mensajeDeError } from '../clientes/http';
import { useGastosStore } from '../stores/gastos';
import { useViajeStore } from '../stores/viaje';
import { formatearMonto } from '../utiles/formato';

const viaje = useViajeStore();
const gastos = useGastosStore();
const pestana = ref<'debo' | 'meDeben'>('debo');
const error = ref('');
// Hasta que llegan las deudas no se muestran las que quedaron de otra visita, que pueden estar viejas.
const cargado = ref(false);

onMounted(async () => {
  try {
    await gastos.cargarDeudas();
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    cargado.value = true;
  }
});
</script>

<template>
  <section>
    <h2>Saldos</h2>
    <p v-if="!cargado">Cargando…</p>
    <div v-else class="pestanas" role="tablist">
      <button
        type="button"
        role="tab"
        class="boton"
        :aria-selected="pestana === 'debo'"
        @click="pestana = 'debo'"
      >
        Debo · {{ formatearMonto(gastos.totalDebo, viaje.actual!.moneda) }}
      </button>
      <button
        type="button"
        role="tab"
        class="boton"
        :aria-selected="pestana === 'meDeben'"
        @click="pestana = 'meDeben'"
      >
        Me deben · {{ formatearMonto(gastos.totalMeDeben, viaje.actual!.moneda) }}
      </button>
    </div>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <div v-if="cargado" role="tabpanel">
      <template v-if="pestana === 'debo'">
        <p v-if="!gastos.debo.length">No le debés nada a nadie.</p>
        <ul class="saldos">
          <FilaSaldo
            v-for="d in gastos.debo"
            :key="d.id"
            :deuda="d"
            :moneda="viaje.actual!.moneda"
          />
        </ul>
      </template>
      <template v-else>
        <p v-if="!gastos.meDeben.length">Nadie te debe nada.</p>
        <ul class="saldos">
          <FilaSaldo
            v-for="d in gastos.meDeben"
            :key="d.id"
            :deuda="d"
            :moneda="viaje.actual!.moneda"
          />
        </ul>
      </template>
    </div>
  </section>
</template>

<style scoped>
.pestanas {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.boton[aria-selected='true'] {
  background: var(--color-acento);
  color: #fff;
}
.saldos {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
