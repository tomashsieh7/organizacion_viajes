<script setup lang="ts">
import { watch } from 'vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import CampoMensaje from '../componentes/chat/CampoMensaje.vue';
import ListaMensajes from '../componentes/chat/ListaMensajes.vue';
import { useChatStore } from '../stores/chat';
import { useSesionStore } from '../stores/sesion';

const chat = useChatStore();
const sesion = useSesionStore();

// El historial se pide cuando el viaje ya está abierto en el chat, aunque la vista se monte antes.
watch(
  () => chat.viajeId,
  (id) => {
    if (id) void chat.cargarHistorial();
  },
  { immediate: true },
);
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
    />
    <CampoMensaje :deshabilitado="!chat.viajeId" @enviar="chat.enviar" />
  </section>
</template>
