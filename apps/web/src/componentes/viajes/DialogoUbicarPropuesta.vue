<script setup lang="ts">
import { computed, ref } from 'vue';
import { sumarDias, type ActividadVista, type AlojamientoVista } from '@viajes/compartido';
import DialogoModal from '../base/DialogoModal.vue';
import AvisoMensaje from '../base/AvisoMensaje.vue';
import { useViajeStore } from '../../stores/viajes';
import { usePropuestasStore } from '../../stores/propuestas';
import { mensajeDeError } from '../../clientes/http';
import { nombreDelDia } from '../../utiles/fechas';

const props = defineProps<{ propuesta: ActividadVista | AlojamientoVista }>();
const emit = defineEmits<{ cerrar: []; guardado: [] }>();
const viaje = useViajeStore();
const store = usePropuestasStore();
const fecha = ref('');
const ocupado = ref(false);
const error = ref('');
const titulo = computed(() =>
  props.propuesta.tipo === 'ACTIVIDAD'
    ? props.propuesta.actividad.titulo
    : props.propuesta.alojamiento.nombre,
);
const salida = computed(() =>
  props.propuesta.tipo === 'ALOJAMIENTO' && fecha.value
    ? sumarDias(fecha.value, props.propuesta.alojamiento.noches ?? 0)
    : null,
);
async function guardar() {
  if (ocupado.value) return;
  error.value = '';
  if (!fecha.value) {
    error.value = 'Elegí un día';
    return;
  }
  ocupado.value = true;
  try {
    await store.ubicar(props.propuesta, fecha.value);
    emit('guardado');
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    ocupado.value = false;
  }
}
</script>
<template>
  <DialogoModal
    :titulo="propuesta.tipo === 'ACTIVIDAD' ? 'Ubicar actividad' : 'Ubicar alojamiento'"
    @cerrar="!ocupado && emit('cerrar')"
  >
    <p>
      <strong>{{ titulo }}</strong>
    </p>
    <form @submit.prevent="guardar">
      <label for="ubicar-fecha">{{ propuesta.tipo === 'ACTIVIDAD' ? 'Día' : 'Entrada' }}</label>
      <input
        id="ubicar-fecha"
        v-model="fecha"
        type="date"
        :min="viaje.actual!.fechaInicio"
        :max="viaje.actual!.fechaFin"
        required
      />
      <p v-if="salida">
        Salida: {{ nombreDelDia(salida) }} ·
        {{ propuesta.tipo === 'ALOJAMIENTO' ? propuesta.alojamiento.noches : '' }} noches
      </p>
      <p v-else-if="propuesta.tipo === 'ACTIVIDAD'">
        {{ propuesta.actividad.horaInicio }} · {{ propuesta.actividad.duracionMin }} minutos
      </p>
      <p class="texto-secundario">Los votos y el estado se conservan.</p>
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <div class="acciones">
        <button type="button" class="boton" :disabled="ocupado" @click="emit('cerrar')">
          Volver</button
        ><button class="boton boton--principal" :disabled="ocupado">Guardar fecha</button>
      </div>
    </form>
  </DialogoModal>
</template>
<style scoped>
label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--esp-2);
}
input {
  width: 100%;
}
</style>
