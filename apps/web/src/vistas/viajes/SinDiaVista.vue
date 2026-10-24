<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type {
  AccionSobrePropuesta,
  ActividadVista,
  AlojamientoVista,
  ValorVoto,
} from '@viajes/compartido';
import TarjetaPropuesta from '../../componentes/propuestas/TarjetaPropuesta.vue';
import AvisoMensaje from '../../componentes/base/AvisoMensaje.vue';
import SiluetaCarga from '../../componentes/base/SiluetaCarga.vue';
import DialogoUbicarPropuesta from '../../componentes/viajes/DialogoUbicarPropuesta.vue';
import { usePropuestasStore } from '../../stores/propuestas';
import { useViajeStore } from '../../stores/viajes';
import { useCarga } from '../../composables/useCarga';
import { mensajeDeError } from '../../clientes/http';

const store = usePropuestasStore();
const viaje = useViajeStore();
const elegida = ref<ActividadVista | AlojamientoVista | null>(null);
const ocupado = ref(false);
const error = ref('');
const { cargado, error: errorCarga, cargar, reintentar } = useCarga(() => store.cargarTodo());
onMounted(cargar);
async function intentar(accion: () => Promise<void>) {
  if (ocupado.value) return;
  ocupado.value = true;
  error.value = '';
  try {
    await accion();
  } catch (e) {
    error.value = mensajeDeError(e);
    await store.cargarTodo().catch(() => undefined);
  } finally {
    ocupado.value = false;
  }
}
const votar = (id: string, valor: ValorVoto) => intentar(() => store.votar(id, valor));
const resolver = (id: string, accion: AccionSobrePropuesta) =>
  intentar(() => store.resolver(id, accion));
</script>
<template>
  <section>
    <h2>Sin día</h2>
    <p class="texto-secundario">Propuestas para ubicar en las fechas del viaje.</p>
    <SiluetaCarga v-if="!cargado" />
    <AvisoMensaje v-else-if="errorCarga" tipo="error" :reintentar="reintentar">{{
      errorCarga
    }}</AvisoMensaje>
    <template v-else>
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <p v-if="!store.sinDia.length">No hay propuestas sin día.</p>
      <div class="bandeja">
        <TarjetaPropuesta
          v-for="p in store.sinDia"
          :key="p.id"
          :propuesta="p"
          :titulo="p.tipo === 'ACTIVIDAD' ? p.actividad.titulo : p.alojamiento.nombre"
          :soy-admin="viaje.soyAdmin"
          :moneda="viaje.actual!.moneda"
          :ocupada="ocupado"
          sin-dia
          @votar="votar(p.id, $event)"
          @desvotar="intentar(() => store.desvotar(p.id))"
          @resolver="resolver(p.id, $event)"
        >
          <p class="texto-secundario">
            {{
              p.tipo === 'ACTIVIDAD'
                ? `${p.actividad.horaInicio} · ${p.actividad.duracionMin} minutos`
                : `${p.alojamiento.noches} noches`
            }}
            · Sin día
          </p>
          <template v-if="viaje.soyAdmin" #acciones>
            <button
              type="button"
              class="boton boton--principal"
              :disabled="ocupado"
              @click="elegida = p"
            >
              Ubicar en un día
            </button>
          </template>
        </TarjetaPropuesta>
      </div>
    </template>
    <DialogoUbicarPropuesta
      v-if="elegida"
      :propuesta="elegida"
      @cerrar="elegida = null"
      @guardado="elegida = null"
    />
  </section>
</template>
<style scoped>
.bandeja {
  max-width: 48rem;
}
</style>
