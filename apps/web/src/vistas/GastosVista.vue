<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import EstadoVacio from '../componentes/base/EstadoVacio.vue';
import SiluetaCarga from '../componentes/base/SiluetaCarga.vue';
import TarjetaGasto from '../componentes/gastos/TarjetaGasto.vue';
import { mensajeDeError } from '../clientes/http';
import { useGastosStore } from '../stores/gastos';
import { useSesionStore } from '../stores/sesion';
import { useViajeStore } from '../stores/viaje';

const viaje = useViajeStore();
const gastos = useGastosStore();
const sesion = useSesionStore();
const error = ref('');
/** Hasta la primera carga no se muestra la lista vacía. */
const cargado = ref(false);

onMounted(() =>
  gastos
    .cargarGastos()
    .catch((e) => (error.value = mensajeDeError(e)))
    .finally(() => (cargado.value = true)),
);
</script>

<template>
  <section>
    <div class="encabezado">
      <h2>Gastos</h2>
      <RouterLink class="boton boton--principal" :to="`/viajes/${viaje.actual!.id}/gastos/nuevo`">
        Anotar gasto
      </RouterLink>
    </div>
    <SiluetaCarga v-if="!cargado" />
    <AvisoMensaje v-else-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <EstadoVacio
      v-else-if="!gastos.gastos.length"
      icono="🧾"
      titulo="Todavía no hay gastos anotados."
      descripcion="Anotá lo que pagaste para el grupo y la app calcula quién le debe a quién."
    >
      <RouterLink class="boton" :to="`/viajes/${viaje.actual!.id}/gastos/nuevo`">
        Anotar el primero
      </RouterLink>
    </EstadoVacio>
    <TarjetaGasto
      v-for="g in gastos.gastos"
      :key="g.id"
      :gasto="g"
      :moneda="viaje.actual!.moneda"
      :mi-id="sesion.usuario?.id ?? ''"
    />
  </section>
</template>
