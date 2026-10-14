<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import EstadoVacio from '../componentes/base/EstadoVacio.vue';
import SiluetaCarga from '../componentes/base/SiluetaCarga.vue';
import FilaSaldo from '../componentes/gastos/FilaSaldo.vue';
import { mensajeDeError } from '../clientes/http';
import { useGastosStore } from '../stores/gastos';
import { useSesionStore } from '../stores/sesion';
import { useViajeStore } from '../stores/viaje';
import { formatearMonto } from '../utiles/formato';

const viaje = useViajeStore();
const gastos = useGastosStore();
const miId = useSesionStore().usuario?.id ?? '';
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
// La confirmación del pago se muestra una sola vez.
onBeforeUnmount(() => (gastos.mensaje = ''));
</script>

<template>
  <section>
    <h2>Saldos</h2>
    <AvisoMensaje v-if="gastos.mensaje" tipo="exito">{{ gastos.mensaje }}</AvisoMensaje>
    <SiluetaCarga v-if="!cargado" :cantidad="2" />
    <div v-else class="pestanas" role="tablist">
      <button
        type="button"
        role="tab"
        class="pestana pestana--debo"
        :aria-selected="pestana === 'debo'"
        @click="pestana = 'debo'"
      >
        <span class="pestana__rotulo">Debo · </span>
        <span class="pestana__total monto">{{
          formatearMonto(gastos.totalDebo, viaje.actual!.moneda)
        }}</span>
      </button>
      <button
        type="button"
        role="tab"
        class="pestana pestana--meDeben"
        :aria-selected="pestana === 'meDeben'"
        @click="pestana = 'meDeben'"
      >
        <span class="pestana__rotulo">Me deben · </span>
        <span class="pestana__total monto">{{
          formatearMonto(gastos.totalMeDeben, viaje.actual!.moneda)
        }}</span>
      </button>
    </div>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <div v-if="cargado" role="tabpanel">
      <template v-if="pestana === 'debo'">
        <EstadoVacio v-if="!gastos.debo.length" icono="🎉" titulo="No le debés nada a nadie." />
        <ul class="saldos">
          <FilaSaldo
            v-for="d in gastos.debo"
            :key="d.id"
            :deuda="d"
            :moneda="viaje.actual!.moneda"
            :mi-id="miId"
            sentido="debo"
          >
            <RouterLink
              class="boton boton--principal"
              :to="`/viajes/${viaje.actual!.id}/saldos/pagar/${d.contraparte.id}`"
            >
              Pagar
            </RouterLink>
          </FilaSaldo>
        </ul>
      </template>
      <template v-else>
        <EstadoVacio v-if="!gastos.meDeben.length" icono="🤝" titulo="Nadie te debe nada." />
        <ul class="saldos">
          <FilaSaldo
            v-for="d in gastos.meDeben"
            :key="d.id"
            :deuda="d"
            :moneda="viaje.actual!.moneda"
            :mi-id="miId"
            sentido="meDeben"
          />
        </ul>
      </template>
    </div>
  </section>
</template>

<style scoped>
/* Los dos totales como pestañas grandes: cuánto debés y cuánto te deben, a simple vista. */
.pestanas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--esp-3);
  margin-bottom: var(--esp-4);
}
.pestana {
  font: inherit;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--esp-1);
  padding: var(--esp-3) var(--esp-4);
  min-height: var(--alto-control);
  text-align: left;
  color: var(--color-texto);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-top: 4px solid var(--color-borde-fuerte);
  border-radius: var(--radio-grande);
  cursor: pointer;
}
.pestana__rotulo {
  color: var(--color-texto-secundario);
  font-weight: 500;
}
.pestana__total {
  font-size: 1.375rem;
  font-weight: 700;
}
.pestana--debo .pestana__total {
  color: var(--color-error);
}
.pestana--meDeben .pestana__total {
  color: var(--color-exito);
}
.pestana[aria-selected='true'] {
  border-color: var(--color-acento);
  border-top-color: var(--color-acento);
  box-shadow: var(--sombra);
}
.saldos {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
