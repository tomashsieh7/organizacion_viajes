<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AvisoMensaje from '../base/AvisoMensaje.vue';
import DialogoModal from '../base/DialogoModal.vue';
import SelectorSucesor from './SelectorSucesor.vue';
import { mensajeDeError } from '../../clientes/http';
import { useCarga } from '../../composables/useCarga';
import { useGastosStore } from '../../stores/gastos';
import { useViajeStore } from '../../stores/viajes';
import { formatearMonto } from '../../utiles/formato';

const props = defineProps<{ miId: string }>();
const emit = defineEmits<{ cerrar: [] }>();
const store = useViajeStore();
const gastos = useGastosStore();
const router = useRouter();
const sucesor = ref('');
const error = ref('');
const enviando = ref(false);
const candidatos = computed(() => store.participantes.filter((p) => p.usuarioId !== props.miId));
const soloQuedoYo = computed(() => store.soyAdmin && candidatos.value.length === 0);
/**
 * RN-E7: los saldos se consultan al abrir el diálogo, porque pudieron cambiar desde que se abrió
 * el viaje (por ejemplo, alguien anotó un gasto). Hasta tenerlos no se puede confirmar la salida.
 */
const saldos = useCarga(() => gastos.cargarDeudas());
onMounted(saldos.cargar);
const listo = computed(() => saldos.cargado.value && !saldos.error.value);

async function salir() {
  if (enviando.value) return;
  if (store.soyAdmin && !sucesor.value) {
    error.value = 'Antes de salir tenés que elegir quién va a ser el nuevo Admin';
    return;
  }
  enviando.value = true;
  try {
    const { id, nombre } = store.actual!;
    await store.salir(store.soyAdmin ? sucesor.value : undefined);
    // RN-E6 y RN-E7: con saldos pendientes el viaje sigue en la lista, con acceso solo a saldos.
    if (store.viajes.some((v) => v.id === id && v.miAcceso === 'SOLO_SALDOS')) {
      await store.abrir(id);
      store.aviso = `Saliste de «${nombre}». Podés seguir viendo tus saldos hasta que queden en cero.`;
      await router.push(`/viajes/${id}/saldos`);
    } else {
      store.avisoLista = `Saliste de «${nombre}».`;
      await router.push('/viajes');
    }
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <DialogoModal titulo="Salir del grupo" @cerrar="emit('cerrar')">
    <AvisoMensaje v-if="soloQuedoYo" tipo="error">
      No podés salir: sos el único participante y no hay a quién transferir la administración.
    </AvisoMensaje>
    <template v-else>
      <p v-if="!saldos.cargado.value" class="texto-secundario">Consultando tus saldos…</p>
      <AvisoMensaje
        v-else-if="saldos.error.value"
        tipo="error"
        :reintentar="saldos.reintentar.value"
        >{{ saldos.error.value }}</AvisoMensaje
      >
      <template v-else-if="store.actual">
        <AvisoMensaje v-if="gastos.totalDebo > 0" tipo="error">
          Todavía debés {{ formatearMonto(gastos.totalDebo, store.actual.moneda) }} al resto del
          grupo. Tu historial se conserva y vas a poder seguir pagando.
        </AvisoMensaje>
        <AvisoMensaje v-if="gastos.totalMeDeben > 0" tipo="info">
          Te deben {{ formatearMonto(gastos.totalMeDeben, store.actual.moneda) }}. Vas a poder
          seguir viéndolo en saldos hasta cobrarlo.
        </AvisoMensaje>
        <p v-if="gastos.totalDebo === 0">Tu historial de gastos y mensajes se conserva.</p>
      </template>
      <SelectorSucesor v-if="store.soyAdmin" v-model="sucesor" :candidatos="candidatos" />
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    </template>
    <div class="acciones">
      <button class="boton" type="button" @click="emit('cerrar')">Cancelar</button>
      <button
        v-if="!soloQuedoYo"
        class="boton boton--peligro"
        type="button"
        :disabled="enviando || !listo"
        @click="salir"
      >
        Salir del grupo
      </button>
    </div>
  </DialogoModal>
</template>
