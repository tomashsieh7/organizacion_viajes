<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { esquemaInicioSesion } from '@viajes/compartido';
import CampoFormulario from '../componentes/base/CampoFormulario.vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import { mensajeDeError } from '../clientes/http';
import { useSesionStore } from '../stores/sesion';

const sesion = useSesionStore();
const router = useRouter();
const route = useRoute();
const datos = reactive({ email: '', password: '' });
const errores = ref<Record<string, string>>({});
const error = ref('');
const enviando = ref(false);

async function enviar() {
  error.value = '';
  const resultado = esquemaInicioSesion.safeParse(datos);
  errores.value = resultado.success
    ? {}
    : Object.fromEntries(resultado.error.issues.map((i) => [String(i.path[0]), i.message]));
  if (!resultado.success) return;
  enviando.value = true;
  try {
    await sesion.ingresar(datos);
    await router.push(
      typeof route.query['volver'] === 'string' ? route.query['volver'] : '/viajes',
    );
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <main class="pagina pagina--angosta">
    <h1>Ingresar</h1>
    <form novalidate @submit.prevent="enviar">
      <CampoFormulario id="email" etiqueta="Email" :error="errores['email']">
        <input id="email" v-model="datos.email" type="email" autocomplete="email" required />
      </CampoFormulario>
      <CampoFormulario id="password" etiqueta="Contraseña" :error="errores['password']">
        <input
          id="password"
          v-model="datos.password"
          type="password"
          autocomplete="current-password"
          required
        />
      </CampoFormulario>
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <button type="submit" class="boton boton--principal" :disabled="enviando">Ingresar</button>
    </form>
    <p>¿No tenés cuenta? <RouterLink to="/registrarse">Registrate</RouterLink></p>
  </main>
</template>
