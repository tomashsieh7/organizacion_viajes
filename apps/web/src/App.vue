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
    <RouterLink to="/viajes" class="marca">
      <span class="marca__icono" aria-hidden="true">🧳</span>Organizador de viajes
    </RouterLink>
    <div v-if="sesion.usuario" class="usuario">
      <span class="usuario__nombre">{{ sesion.usuario.nombre }}</span>
      <button class="boton boton--chico" type="button" @click="cerrarSesion">Cerrar sesión</button>
    </div>
  </header>
  <RouterView />
</template>

<style>
/*
 * Base visual: variables de diseño (colores, espaciado, tipografía) y estilos comunes. Los colores
 * cumplen contraste AA en los dos modos; el oscuro sigue la preferencia del sistema.
 */
:root {
  color-scheme: light dark;
  --color-texto: #1f2328;
  --color-texto-secundario: #59636e;
  --color-fondo: #f6f8fa;
  --color-superficie: #ffffff;
  --color-superficie-alt: #f6f8fa;
  --color-borde: #d1d9e0;
  --color-borde-fuerte: #818b98;
  --color-acento: #0969da;
  --color-sobre-acento: #ffffff;
  --color-acento-suave: #ddf4ff;
  --color-exito: #1a7f37;
  --color-exito-suave: #dafbe1;
  --color-error: #cf222e;
  --color-error-suave: #ffebe9;
  --color-aviso: #9a6700;
  --color-aviso-suave: #fff8c5;
  --color-neutro: #59636e;
  --color-neutro-suave: #eff2f5;
  --sombra: 0 1px 2px rgb(31 35 40 / 0.06), 0 1px 3px rgb(31 35 40 / 0.08);
  --sombra-elevada: 0 8px 24px rgb(31 35 40 / 0.16);
  --fondo-modal: rgb(31 35 40 / 0.5);

  --esp-1: 0.25rem;
  --esp-2: 0.5rem;
  --esp-3: 0.75rem;
  --esp-4: 1rem;
  --esp-5: 1.5rem;
  --esp-6: 2rem;
  --radio: 8px;
  --radio-grande: 12px;
  --alto-control: 2.75rem;
  --alto-barra-inferior: 4rem;
  --duracion: 150ms;

  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-size: 100%;
  line-height: 1.5;
  color: var(--color-texto);
  background: var(--color-fondo);
  -webkit-text-size-adjust: 100%;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-texto: #e6edf3;
    --color-texto-secundario: #9198a1;
    --color-fondo: #0d1117;
    --color-superficie: #151b23;
    --color-superficie-alt: #212830;
    --color-borde: #3d444d;
    --color-borde-fuerte: #656c76;
    --color-acento: #4493f8;
    --color-sobre-acento: #0d1117;
    --color-acento-suave: #15243a;
    --color-exito: #3fb950;
    --color-exito-suave: #12261e;
    --color-error: #f85149;
    --color-error-suave: #2d1214;
    --color-aviso: #d29922;
    --color-aviso-suave: #272115;
    --color-neutro: #9198a1;
    --color-neutro-suave: #212830;
    --sombra: 0 1px 2px rgb(0 0 0 / 0.4);
    --sombra-elevada: 0 8px 24px rgb(0 0 0 / 0.5);
    --fondo-modal: rgb(0 0 0 / 0.6);
  }
}
@media (prefers-reduced-motion: reduce) {
  :root {
    --duracion: 0.01ms;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

*,
*::before,
*::after {
  box-sizing: border-box;
}
body {
  margin: 0;
  min-height: 100vh;
}
h1,
h2,
h3,
h4 {
  line-height: 1.25;
  margin: 0 0 var(--esp-3);
}
h1 {
  font-size: 1.75rem;
}
h2 {
  font-size: 1.375rem;
}
h3 {
  font-size: 1.125rem;
}
p {
  margin: 0 0 var(--esp-3);
}
a {
  color: var(--color-acento);
  text-underline-offset: 0.15em;
}
a:hover {
  text-decoration-thickness: 2px;
}
/* WCAG 2.4.7: el foco del teclado siempre se ve, con un borde de 2 px bien contrastado. */
:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}

/* Encabezado de la aplicación */
.barra {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--esp-3);
  padding: var(--esp-2) var(--esp-4);
  border-bottom: 1px solid var(--color-borde);
  background: var(--color-superficie);
}
.marca {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-2);
  min-height: var(--alto-control);
  font-weight: 700;
  color: inherit;
  text-decoration: none;
}
.marca__icono {
  font-size: 1.4rem;
}
.usuario {
  display: flex;
  gap: var(--esp-3);
  align-items: center;
}
.usuario__nombre {
  color: var(--color-texto-secundario);
}

/* Diseño de página */
.pagina {
  max-width: 60rem;
  margin: var(--esp-5) auto;
  padding: 0 var(--esp-4);
}
.pagina--angosta {
  max-width: 28rem;
}
.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--esp-2) var(--esp-3);
  margin-bottom: var(--esp-4);
}
.encabezado > h1,
.encabezado > h2 {
  margin: 0;
}
.panel {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  box-shadow: var(--sombra);
  padding: var(--esp-4);
}
.formulario {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  padding: var(--esp-5) var(--esp-4);
}
.fila {
  display: flex;
  gap: var(--esp-3);
  flex-wrap: wrap;
}
.fila > * {
  flex: 1 1 12rem;
}
.acciones {
  display: flex;
  gap: var(--esp-2);
  justify-content: flex-end;
  align-items: center;
  margin-top: var(--esp-4);
  flex-wrap: wrap;
}

/* Controles de formulario: 44 px de alto para tocarlos con comodidad. */
input,
select,
textarea {
  font: inherit;
  color: var(--color-texto);
  background: var(--color-superficie);
  min-height: var(--alto-control);
  padding: var(--esp-2) var(--esp-3);
  border: 1px solid var(--color-borde-fuerte);
  border-radius: var(--radio);
  max-width: 100%;
}
textarea {
  resize: vertical;
  min-height: 5.5rem;
}
input[type='checkbox'],
input[type='radio'] {
  min-height: auto;
  width: 1.15rem;
  height: 1.15rem;
  accent-color: var(--color-acento);
}
input::placeholder,
textarea::placeholder {
  color: var(--color-texto-secundario);
  opacity: 1;
}
[aria-invalid='true'] {
  border-color: var(--color-error);
}
label {
  font-weight: 500;
}

.boton {
  font: inherit;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--esp-2);
  min-height: var(--alto-control);
  padding: var(--esp-2) var(--esp-4);
  border-radius: var(--radio);
  border: 1px solid var(--color-borde-fuerte);
  background: var(--color-superficie);
  color: var(--color-texto);
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color var(--duracion),
    border-color var(--duracion);
}
.boton:hover:not(:disabled) {
  background: var(--color-superficie-alt);
}
.boton--principal {
  background: var(--color-acento);
  border-color: var(--color-acento);
  color: var(--color-sobre-acento);
}
.boton--principal:hover:not(:disabled) {
  background: var(--color-acento);
  filter: brightness(1.1);
}
.boton--peligro {
  color: var(--color-error);
  border-color: var(--color-error);
}
.boton--peligro:hover:not(:disabled) {
  background: var(--color-error-suave);
}
.boton--chico {
  min-height: 2.25rem;
  padding: var(--esp-1) var(--esp-3);
  font-size: 0.9375rem;
}
.boton:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Etiquetas e insignias: el color acompaña al texto, nunca lo reemplaza. */
.etiqueta {
  display: inline-block;
  font-size: 0.8125rem;
  line-height: 1.4;
  padding: 0 var(--esp-2);
  margin-left: var(--esp-1);
  border-radius: 999px;
  background: var(--color-neutro-suave);
  color: var(--color-neutro);
  border: 1px solid var(--color-borde);
}
.insignia {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-1);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
  padding: 0.125rem var(--esp-2);
  border-radius: 999px;
  white-space: nowrap;
}
.insignia--PENDIENTE {
  background: var(--color-aviso-suave);
  color: var(--color-aviso);
}
.insignia--CONFIRMADA {
  background: var(--color-exito-suave);
  color: var(--color-exito);
}
.insignia--DENEGADA {
  background: var(--color-error-suave);
  color: var(--color-error);
}
.insignia--CANCELADA {
  background: var(--color-neutro-suave);
  color: var(--color-neutro);
}

.ayuda,
.texto-secundario {
  color: var(--color-texto-secundario);
}
.monto {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
/* Oculta un texto a la vista y lo deja para los lectores de pantalla. */
.solo-lectores {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>
