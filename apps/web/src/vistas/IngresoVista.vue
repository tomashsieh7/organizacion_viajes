<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { esquemaInicioSesion } from '@viajes/compartido';
import CampoFormulario from '../componentes/base/CampoFormulario.vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import { mensajeDeError } from '../clientes/http';
import { useSesionStore } from '../stores/sesion';
import { useValidacion } from '../composables/useValidacion';
import { problemasSegun } from '../utiles/formularios';
import { destinoTrasIngresar } from '../utiles/navegacion';

const sesion = useSesionStore();
const router = useRouter();
const route = useRoute();
const datos = reactive({ email: '', password: '' });
const { errores, alSalir, validarTodo, aria } = useValidacion(
  () => problemasSegun(esquemaInicioSesion, datos),
  datos,
);
const error = ref('');
const enviando = ref(false);

async function enviar() {
  error.value = '';
  if (!validarTodo()) return;
  enviando.value = true;
  try {
    await sesion.ingresar(datos);
    await router.push(destinoTrasIngresar(route.query['volver']));
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
    <p class="texto-secundario">
      Organizá tus viajes en grupo: alojamientos, actividades y gastos.
    </p>
    <form class="formulario" novalidate @submit.prevent="enviar" @focusout="alSalir">
      <CampoFormulario id="email" etiqueta="Email" :error="errores['email']">
        <input
          id="email"
          v-model="datos.email"
          name="email"
          type="email"
          autocomplete="email"
          required
          v-bind="aria('email', 'email')"
        />
      </CampoFormulario>
      <CampoFormulario id="password" etiqueta="Contraseña" :error="errores['password']">
        <input
          id="password"
          v-model="datos.password"
          name="password"
          type="password"
          autocomplete="current-password"
          v-bind="aria('password', 'password')"
          required
        />
      </CampoFormulario>
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <button type="submit" class="boton boton--principal" :disabled="enviando">Ingresar</button>
    </form>
    <p>¿No tenés cuenta? <RouterLink to="/registrarse">Registrate</RouterLink></p>
  </main>
</template>
