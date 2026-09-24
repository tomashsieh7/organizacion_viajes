<script setup lang="ts">
import { ref } from 'vue';
import { esquemaAgregarViajero } from '@viajes/compartido';
import AvisoMensaje from '../base/AvisoMensaje.vue';
import { mensajeDeError } from '../../clientes/http';
import { useViajeStore } from '../../stores/viaje';

const store = useViajeStore();
const email = ref('');
const error = ref('');
const exito = ref('');
const enviando = ref(false);

async function agregar() {
  error.value = '';
  exito.value = '';
  const resultado = esquemaAgregarViajero.safeParse({ email: email.value });
  if (!resultado.success) {
    error.value = resultado.error.issues[0]?.message ?? 'Email inválido';
    return;
  }
  enviando.value = true;
  try {
    await store.agregarViajero(resultado.data.email);
    exito.value = `Se agregó a ${resultado.data.email}`;
    email.value = '';
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <form class="agregar" novalidate @submit.prevent="agregar">
    <label for="agregar-email">Agregar a alguien registrado, por su email</label>
    <div class="fila">
      <input id="agregar-email" v-model="email" type="email" placeholder="persona@mail.com" />
      <button type="submit" class="boton boton--principal" :disabled="enviando">Agregar</button>
    </div>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <AvisoMensaje v-if="exito" tipo="exito">{{ exito }}</AvisoMensaje>
  </form>
</template>
