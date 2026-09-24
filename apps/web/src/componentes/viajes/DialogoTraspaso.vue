<script setup lang="ts">
import { computed, ref } from 'vue';
import AvisoMensaje from '../base/AvisoMensaje.vue';
import DialogoModal from '../base/DialogoModal.vue';
import SelectorSucesor from './SelectorSucesor.vue';
import { mensajeDeError } from '../../clientes/http';
import { useViajeStore } from '../../stores/viaje';

const props = defineProps<{ miId: string }>();
const emit = defineEmits<{ cerrar: [] }>();
const store = useViajeStore();
const sucesor = ref('');
const error = ref('');
const candidatos = computed(() => store.participantes.filter((p) => p.usuarioId !== props.miId));

async function transferir() {
  if (!sucesor.value) {
    error.value = 'Elegí quién va a ser el nuevo Admin';
    return;
  }
  try {
    await store.transferirAdministracion(sucesor.value);
    emit('cerrar');
  } catch (e) {
    error.value = mensajeDeError(e);
  }
}
</script>

<template>
  <DialogoModal titulo="Transferir la administración" @cerrar="emit('cerrar')">
    <p>Vas a seguir en el grupo como viajero y el elegido pasa a ser el Admin.</p>
    <SelectorSucesor v-model="sucesor" :candidatos="candidatos" />
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <div class="acciones">
      <button class="boton" type="button" @click="emit('cerrar')">Cancelar</button>
      <button class="boton boton--principal" type="button" @click="transferir">Transferir</button>
    </div>
  </DialogoModal>
</template>
