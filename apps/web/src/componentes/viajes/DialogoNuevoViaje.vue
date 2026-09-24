<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { esquemaViajeNuevo } from '@viajes/compartido';
import CampoFormulario from '../base/CampoFormulario.vue';
import AvisoMensaje from '../base/AvisoMensaje.vue';
import DialogoModal from '../base/DialogoModal.vue';
import { ErrorDeApi, mensajeDeError } from '../../clientes/http';
import { useViajeStore } from '../../stores/viaje';

const emit = defineEmits<{ cerrar: []; creado: [viajeId: string] }>();
const store = useViajeStore();
const datos = reactive({
  nombre: '',
  destino: '',
  fechaInicio: '',
  fechaFin: '',
  monedaCodigo: 'ARS',
});
const errores = ref<Record<string, string>>({});
const error = ref('');
const enviando = ref(false);

onMounted(() => store.cargarMonedas().catch((e) => (error.value = mensajeDeError(e))));

async function enviar() {
  error.value = '';
  const resultado = esquemaViajeNuevo.safeParse(datos);
  errores.value = resultado.success
    ? {}
    : Object.fromEntries(resultado.error.issues.map((i) => [String(i.path[0]), i.message]));
  if (!resultado.success) return;
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
    <form novalidate @submit.prevent="enviar">
      <CampoFormulario id="viaje-nombre" etiqueta="Nombre" :error="errores['nombre']">
        <input id="viaje-nombre" v-model="datos.nombre" placeholder="Bariloche 2026" />
      </CampoFormulario>
      <CampoFormulario id="viaje-destino" etiqueta="Destino" :error="errores['destino']">
        <input id="viaje-destino" v-model="datos.destino" />
      </CampoFormulario>
      <div class="fila">
        <CampoFormulario id="viaje-inicio" etiqueta="Desde" :error="errores['fechaInicio']">
          <input id="viaje-inicio" v-model="datos.fechaInicio" type="date" />
        </CampoFormulario>
        <CampoFormulario id="viaje-fin" etiqueta="Hasta" :error="errores['fechaFin']">
          <input id="viaje-fin" v-model="datos.fechaFin" type="date" :min="datos.fechaInicio" />
        </CampoFormulario>
      </div>
      <CampoFormulario
        id="viaje-moneda"
        etiqueta="Moneda de los gastos"
        :error="errores['monedaCodigo']"
      >
        <select id="viaje-moneda" v-model="datos.monedaCodigo">
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
