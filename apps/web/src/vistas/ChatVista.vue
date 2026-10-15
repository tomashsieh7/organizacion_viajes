<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import CampoMensaje from '../componentes/chat/CampoMensaje.vue';
import ListaMensajes from '../componentes/chat/ListaMensajes.vue';
import { useChatStore } from '../stores/chat';
import { useSesionStore } from '../stores/sesion';
import { textoEscribiendo } from '../utiles/formato';

const chat = useChatStore();
const sesion = useSesionStore();
const escribiendo = computed(() => textoEscribiendo(chat.quienesEscriben));

/** Con el chat abierto, lo que llega de otros se marca leído como mucho cada 2 segundos. */
const ESPERA_LECTURA_MS = 2_000;
let lectura: ReturnType<typeof setTimeout> | undefined;

// El historial se pide cuando el viaje ya está abierto en el chat, aunque la vista se monte antes.
watch(
  () => chat.viajeId,
  (id) => {
    if (!id) return;
    void chat.cargarHistorial();
    void chat.marcarLeido();
  },
  { immediate: true },
);

watch(
  () => chat.mensajes.at(-1),
  (m) => {
    if (!m || m.autor.id === sesion.usuario?.id || lectura) return;
    lectura = setTimeout(() => {
      lectura = undefined;
      void chat.marcarLeido();
    }, ESPERA_LECTURA_MS);
  },
);

// Al salir, lo que llegó mientras estaba abierto también queda leído.
onBeforeUnmount(() => {
  clearTimeout(lectura);
  void chat.marcarLeido();
});
</script>

<template>
  <section>
    <h2>Chat del grupo</h2>
    <AvisoMensaje v-if="chat.error" tipo="error">{{ chat.error }}</AvisoMensaje>
    <ListaMensajes
      :mensajes="chat.mensajes"
      :mi-id="sesion.usuario?.id ?? ''"
      :hay-mas="chat.hayMas"
      @anteriores="chat.cargarAnteriores"
      @reaccionar="chat.reaccionar"
    />
    <!-- Sin región viva: el lector de pantalla no lo anuncia a cada rato. -->
    <p class="escribiendo">{{ escribiendo }}</p>
    <CampoMensaje
      :deshabilitado="!chat.viajeId"
      @enviar="chat.enviar"
      @escribiendo="chat.avisarEscribiendo"
    />
  </section>
</template>

<style scoped>
/* Reserva el renglón aunque nadie escriba, así el campo no salta. */
.escribiendo {
  min-height: 1.25rem;
  margin: var(--esp-1) 0 0;
  font-size: 0.8rem;
  font-style: italic;
  color: var(--color-texto-secundario);
}
</style>
