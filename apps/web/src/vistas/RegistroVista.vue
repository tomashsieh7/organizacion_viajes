<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { CONTRASENA_MIN, esContrasenaComun, esquemaRegistro } from '@viajes/compartido';
import CampoFormulario from '../componentes/base/CampoFormulario.vue';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import { ErrorDeApi, mensajeDeError } from '../clientes/http';
import { useSesionStore } from '../stores/sesion';

const sesion = useSesionStore();
const router = useRouter();
const datos = reactive({ nombre: '', apodo: '', email: '', password: '' });
const errores = ref<Record<string, string>>({});
const error = ref('');
const enviando = ref(false);

async function enviar() {
  error.value = '';
  const resultado = esquemaRegistro.safeParse(datos);
  errores.value = resultado.success
    ? {}
    : Object.fromEntries(resultado.error.issues.map((i) => [String(i.path[0]), i.message]));
  if (resultado.success && esContrasenaComun(datos.password)) {
    errores.value = { password: 'Esa contraseña es demasiado común; elegí otra' };
  }
  if (Object.keys(errores.value).length > 0) return;
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
    <form novalidate @submit.prevent="enviar">
      <CampoFormulario id="nombre" etiqueta="Nombre" :error="errores['nombre']">
        <input id="nombre" v-model="datos.nombre" autocomplete="name" required />
      </CampoFormulario>
      <CampoFormulario id="apodo" etiqueta="Apodo (opcional)" :error="errores['apodo']">
        <input id="apodo" v-model="datos.apodo" autocomplete="nickname" />
      </CampoFormulario>
      <CampoFormulario id="email" etiqueta="Email" :error="errores['email']">
        <input id="email" v-model="datos.email" type="email" autocomplete="email" required />
      </CampoFormulario>
      <CampoFormulario id="password" etiqueta="Contraseña" :error="errores['password']">
        <input
          id="password"
          v-model="datos.password"
          type="password"
          autocomplete="new-password"
          required
        />
        <small class="ayuda"
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
