<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  CONTRASENA_MIN,
  LARGOS_MAXIMOS,
  esContrasenaComun,
  esquemaRegistro,
} from '@viajes/compartido';
import CampoFormulario from '../componentes/base/CampoFormulario.vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import { ErrorDeApi, mensajeDeError } from '../clientes/http';
import { useSesionStore } from '../stores/sesion';
import { useValidacion } from '../composables/useValidacion';
import { problemasSegun } from '../utiles/formularios';

const sesion = useSesionStore();
const router = useRouter();
const datos = reactive({ nombre: '', apodo: '', email: '', password: '' });
const { errores, alSalir, validarTodo, aria } = useValidacion(() => {
  const problemas = problemasSegun(esquemaRegistro, datos);
  // RN-S1: la contraseña común se avisa antes de llamar a la API.
  if (!problemas['password'] && datos.password && esContrasenaComun(datos.password)) {
    problemas['password'] = 'Esa contraseña es demasiado común; elegí otra';
  }
  return problemas;
}, datos);
const error = ref('');
const enviando = ref(false);

async function enviar() {
  error.value = '';
  if (!validarTodo()) return;
  enviando.value = true;
  try {
    await sesion.registrarse(datos);
    await router.push('/viajes');
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
  <main class="pagina pagina--angosta">
    <h1>Crear cuenta</h1>
    <p class="texto-secundario">Con tu cuenta podés crear grupos o sumarte a los de tus amigos.</p>
    <form class="formulario" novalidate @submit.prevent="enviar" @focusout="alSalir">
      <CampoFormulario id="nombre" etiqueta="Nombre" :error="errores['nombre']">
        <input
          id="nombre"
          v-model="datos.nombre"
          :maxlength="LARGOS_MAXIMOS.nombrePersona"
          name="nombre"
          autocomplete="name"
          required
          v-bind="aria('nombre', 'nombre')"
        />
      </CampoFormulario>
      <CampoFormulario id="apodo" etiqueta="Apodo (opcional)" :error="errores['apodo']">
        <input
          id="apodo"
          v-model="datos.apodo"
          :maxlength="LARGOS_MAXIMOS.apodo"
          name="apodo"
          autocomplete="nickname"
          v-bind="aria('apodo', 'apodo')"
        />
      </CampoFormulario>
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
          autocomplete="new-password"
          v-bind="aria('password', 'password', 'password-ayuda')"
          required
        />
        <small id="password-ayuda" class="ayuda"
          >Al menos {{ CONTRASENA_MIN }} caracteres. Evitá contraseñas comunes.</small
        >
      </CampoFormulario>
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <button type="submit" class="boton boton--principal" :disabled="enviando">
        Crear cuenta
      </button>
    </form>
    <p>¿Ya tenés cuenta? <RouterLink to="/ingresar">Ingresá</RouterLink></p>
  </main>
</template>
