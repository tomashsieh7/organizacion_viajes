<script setup lang="ts">
import { watch } from 'vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import SiluetaCarga from '../componentes/base/SiluetaCarga.vue';
import CampoMensaje from '../componentes/chat/CampoMensaje.vue';
import ListaMensajes from '../componentes/chat/ListaMensajes.vue';
import { useCarga } from '../composables/useCarga';
import { useChatStore } from '../stores/chat';
import { useSesionStore } from '../stores/sesion';

const chat = useChatStore();
const sesion = useSesionStore();
/** Hasta que llega el historial no se muestra "Todavía no hay mensajes". */
const { cargado, error, cargar, reintentar } = useCarga(() => chat.cargarHistorial());

// El historial se pide cuando el viaje ya está abierto en el chat, aunque la vista se monte antes.
watch(
  () => chat.viajeId,
  (id) => {
    if (id) void cargar();
  },
  { immediate: true },
);
</script>

<template>
  <section>
    <h2>Chat del grupo</h2>
    <AvisoMensaje v-if="chat.error" tipo="error">{{ chat.error }}</AvisoMensaje>
    <SiluetaCarga v-if="!cargado" />
    <AvisoMensaje v-else-if="error" tipo="error" :reintentar="reintentar">{{ error }}</AvisoMensaje>
    <ListaMensajes
      v-else
      :mensajes="chat.mensajes"
      :mi-id="sesion.usuario?.id ?? ''"
      :hay-mas="chat.hayMas"
      @anteriores="chat.cargarAnteriores"
    />
    <CampoMensaje :deshabilitado="!chat.viajeId" @enviar="chat.enviar" />
  </section>
</template>
