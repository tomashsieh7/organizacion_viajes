<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useSesionStore } from './stores/sesion';

const sesion = useSesionStore();
const router = useRouter();

async function cerrarSesion() {
  await sesion.cerrarSesion();
  await router.push('/ingresar');
}
</script>

<template>
  <header class="barra">
    <RouterLink to="/viajes" class="marca">Organizador de viajes</RouterLink>
    <div v-if="sesion.usuario" class="usuario">
      <span>{{ sesion.usuario.nombre }}</span>
      <button class="boton" type="button" @click="cerrarSesion">Cerrar sesión</button>
    </div>
  </header>
  <RouterView />
</template>

<style>
:root {
  --color-texto: #1f2328;
  --color-fondo: #ffffff;
  --color-superficie: #f6f8fa;
  --color-borde: #d0d7de;
  --color-acento: #0969da;
  --color-exito: #1a7f37;
  --color-error: #cf222e;
  --radio: 8px;
  font-family: system-ui, sans-serif;
  color: var(--color-texto);
  background: var(--color-fondo);
}
body {
  margin: 0;
}
.barra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-superficie);
}
.marca {
  font-weight: bold;
  color: inherit;
  text-decoration: none;
}
.usuario {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.pagina {
  max-width: 60rem;
  margin: 1.5rem auto;
  padding: 0 1rem;
}
.pagina--angosta {
  max-width: 26rem;
}
.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
input,
select {
  font: inherit;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
}
.fila {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.fila > * {
  flex: 1;
}
.acciones {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
  flex-wrap: wrap;
}
.boton {
  font: inherit;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radio);
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  cursor: pointer;
}
.boton--principal {
  background: var(--color-acento);
  border-color: var(--color-acento);
  color: #fff;
}
.boton--peligro {
  color: var(--color-error);
  border-color: var(--color-error);
}
.boton:disabled {
  opacity: 0.6;
  cursor: default;
}
.etiqueta {
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.05rem 0.4rem;
  margin-left: 0.3rem;
  border-radius: 999px;
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
}
.ayuda {
  color: #57606a;
}
</style>
