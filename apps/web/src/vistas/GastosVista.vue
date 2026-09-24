<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import TarjetaGasto from '../componentes/gastos/TarjetaGasto.vue';
import { mensajeDeError } from '../clientes/http';
import { useGastosStore } from '../stores/gastos';
import { useSesionStore } from '../stores/sesion';
import { useViajeStore } from '../stores/viaje';

const viaje = useViajeStore();
const gastos = useGastosStore();
const sesion = useSesionStore();
const error = ref('');

onMounted(() => gastos.cargarGastos().catch((e) => (error.value = mensajeDeError(e))));
</script>

<template>
  <section>
    <div class="encabezado">
      <h2>Gastos</h2>
      <RouterLink class="boton boton--principal" :to="`/viajes/${viaje.actual!.id}/gastos/nuevo`">
        Anotar gasto
      </RouterLink>
    </div>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <p v-else-if="!gastos.gastos.length">Todavía no hay gastos anotados.</p>
    <TarjetaGasto
      v-for="g in gastos.gastos"
      :key="g.id"
      :gasto="g"
      :moneda="viaje.actual!.moneda"
      :mi-id="sesion.usuario?.id ?? ''"
    />
  </section>
</template>
