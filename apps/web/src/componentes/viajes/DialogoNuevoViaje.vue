<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { esquemaViajeNuevo } from '@viajes/compartido';
import CampoFormulario from '../base/CampoFormulario.vue';
import AvisoMensaje from '../base/AvisoMensaje.vue';
import DialogoModal from '../base/DialogoModal.vue';
import { ErrorDeApi, mensajeDeError } from '../../clientes/http';
import { useViajeStore } from '../../stores/viaje';
import { useValidacion } from '../../composables/useValidacion';
import { problemasSegun } from '../../utiles/formularios';

const emit = defineEmits<{ cerrar: []; creado: [viajeId: string] }>();
const store = useViajeStore();
const datos = reactive({
  nombre: '',
  destino: '',
  fechaInicio: '',
  fechaFin: '',
  monedaCodigo: 'ARS',
});
const { errores, alSalir, validarTodo, aria } = useValidacion(
  () => problemasSegun(esquemaViajeNuevo, datos),
  datos,
);
const error = ref('');
const enviando = ref(false);

onMounted(() => store.cargarMonedas().catch((e) => (error.value = mensajeDeError(e))));

async function enviar() {
  error.value = '';
  if (!validarTodo()) return;
  enviando.value = true;
  try {
    const viaje = await store.crearViaje(datos);
    emit('creado', viaje.id);
  } catch (e) {
    if (e instanceof ErrorDeApi && Object.keys(e.erroresPorCampo).length > 0)
      errores.value = e.erroresPorCampo;
    else error.value = mensajeDeError(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <DialogoModal titulo="Nuevo grupo de viaje" @cerrar="emit('cerrar')">
    <form novalidate @submit.prevent="enviar" @focusout="alSalir">
      <CampoFormulario id="viaje-nombre" etiqueta="Nombre" :error="errores['nombre']">
        <input
          id="viaje-nombre"
          v-bind="aria('nombre', 'viaje-nombre')"
          v-model="datos.nombre"
          name="nombre"
          placeholder="Bariloche 2026"
        />
      </CampoFormulario>
      <CampoFormulario id="viaje-destino" etiqueta="Destino" :error="errores['destino']">
        <input
          id="viaje-destino"
          v-bind="aria('destino', 'viaje-destino')"
          v-model="datos.destino"
          name="destino"
        />
      </CampoFormulario>
      <div class="fila">
        <CampoFormulario id="viaje-inicio" etiqueta="Desde" :error="errores['fechaInicio']">
          <input
            id="viaje-inicio"
            v-bind="aria('fechaInicio', 'viaje-inicio')"
            v-model="datos.fechaInicio"
            name="fechaInicio"
            type="date"
          />
        </CampoFormulario>
        <CampoFormulario id="viaje-fin" etiqueta="Hasta" :error="errores['fechaFin']">
          <input
            id="viaje-fin"
            v-bind="aria('fechaFin', 'viaje-fin')"
            v-model="datos.fechaFin"
            name="fechaFin"
            type="date"
            :min="datos.fechaInicio"
          />
        </CampoFormulario>
      </div>
      <CampoFormulario
        id="viaje-moneda"
        etiqueta="Moneda de los gastos"
        :error="errores['monedaCodigo']"
      >
        <select
          id="viaje-moneda"
          v-bind="aria('monedaCodigo', 'viaje-moneda')"
          v-model="datos.monedaCodigo"
          name="monedaCodigo"
        >
          <option v-for="m in store.monedas" :key="m.codigo" :value="m.codigo">
            {{ m.nombre }} ({{ m.codigo }})
          </option>
        </select>
      </CampoFormulario>
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <div class="acciones">
        <button type="button" class="boton" @click="emit('cerrar')">Cancelar</button>
        <button type="submit" class="boton boton--principal" :disabled="enviando">Crear</button>
      </div>
    </form>
  </DialogoModal>
</template>
