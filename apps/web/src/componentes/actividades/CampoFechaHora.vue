<script setup lang="ts">
import CampoFormulario from '../base/CampoFormulario.vue';

/** Día y hora de inicio de una actividad; el día se limita a las fechas del viaje (P11). */
defineProps<{
  desde: string;
  hasta: string;
  errores: { fecha?: string | undefined; horaInicio?: string | undefined };
}>();
const fecha = defineModel<string>('fecha', { required: true });
const hora = defineModel<string>('hora', { required: true });
</script>

<template>
  <div class="fila">
    <CampoFormulario id="actividad-fecha" etiqueta="Día" :error="errores.fecha">
      <input id="actividad-fecha" v-model="fecha" type="date" :min="desde" :max="hasta" />
    </CampoFormulario>
    <CampoFormulario id="actividad-hora" etiqueta="Hora de inicio" :error="errores.horaInicio">
      <input id="actividad-hora" v-model="hora" type="time" />
    </CampoFormulario>
  </div>
</template>
