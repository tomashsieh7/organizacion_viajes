<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AvisoMensaje from '../base/AvisoMensaje.vue';
import DialogoModal from '../base/DialogoModal.vue';
import SelectorSucesor from './SelectorSucesor.vue';
import { mensajeDeError } from '../../clientes/http';
import { useViajeStore } from '../../stores/viaje';
import { formatearMonto } from '../../utiles/formato';

const props = defineProps<{ miId: string }>();
const emit = defineEmits<{ cerrar: [] }>();
const store = useViajeStore();
const router = useRouter();
const sucesor = ref('');
const error = ref('');
const candidatos = computed(() => store.participantes.filter((p) => p.usuarioId !== props.miId));
const soloQuedoYo = computed(() => store.soyAdmin && candidatos.value.length === 0);
const deuda = computed(() => store.actual?.miDeudaPendiente ?? 0);

async function salir() {
  if (store.soyAdmin && !sucesor.value) {
    error.value = 'Antes de salir tenés que elegir quién va a ser el nuevo Admin';
    return;
  }
  try {
    await store.salir(store.soyAdmin ? sucesor.value : undefined);
    await router.push('/viajes');
  } catch (e) {
    error.value = mensajeDeError(e);
  }
}
</script>

<template>
  <DialogoModal titulo="Salir del grupo" @cerrar="emit('cerrar')">
    <AvisoMensaje v-if="soloQuedoYo" tipo="error">
      No podés salir: sos el único participante y no hay a quién transferir la administración.
    </AvisoMensaje>
    <template v-else>
      <AvisoMensaje v-if="deuda > 0 && store.actual" tipo="error">
        Todavía debés {{ formatearMonto(deuda, store.actual.moneda) }} al resto del grupo. Tu
        historial se conserva y vas a poder seguir pagando.
      </AvisoMensaje>
      <p v-else>Tu historial de gastos y mensajes se conserva.</p>
      <SelectorSucesor v-if="store.soyAdmin" v-model="sucesor" :candidatos="candidatos" />
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    </template>
    <div class="acciones">
      <button class="boton" type="button" @click="emit('cerrar')">Cancelar</button>
      <button v-if="!soloQuedoYo" class="boton boton--peligro" type="button" @click="salir">
        Salir del grupo
      </button>
    </div>
  </DialogoModal>
</template>
