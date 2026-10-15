<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AvisoCelebracion from './componentes/base/AvisoCelebracion.vue';
import AvisoMensaje from './componentes/base/AvisoMensaje.vue';
import IconoLinea from './componentes/base/IconoLinea.vue';
import { useSesionStore } from './stores/sesion';

const sesion = useSesionStore();
const router = useRouter();
const route = useRoute();
const contenido = ref<HTMLElement | null>(null);
/** Lo que anuncia el lector de pantalla al cambiar de página, sin mover el foco. */
const anuncio = ref('');
/** Un error que ningún componente manejó: se avisa en lugar de dejar la pantalla a medias. */
const errorInesperado = ref(false);

async function cerrarSesion() {
  await sesion.cerrarSesion();
  await router.push('/ingresar');
}

/**
 * WCAG 2.4.1: con el teclado se puede saltar el encabezado y los menús. Dentro de un viaje el
 * destino es la sección (`#seccion` de ViajeLayout), después de los grupos y las pestañas.
 */
function irAlContenido() {
  (document.getElementById('seccion') ?? contenido.value)?.focus();
}

watch(
  () => route.path,
  (_ruta, anterior) => {
    errorInesperado.value = false;
    // La primera carga la anuncia el navegador con el título de la pestaña.
    if (anterior !== undefined) anuncio.value = String(route.meta['titulo'] ?? '');
  },
);

onErrorCaptured((error) => {
  console.error(error);
  errorInesperado.value = true;
  return false;
});
</script>

<template>
  <a class="saltar" href="#contenido" @click.prevent="irAlContenido">Saltar al contenido</a>
  <header class="barra">
    <RouterLink to="/viajes" class="marca">
      <IconoLinea nombre="mapa" class="marca__icono" :tamano="22" /><span class="marca__largo"
        >Organizador de viajes</span
      ><span class="marca__corto">Viajes</span>
    </RouterLink>
    <div v-if="sesion.usuario" class="usuario">
      <span class="usuario__nombre">{{ sesion.usuario.nombre }}</span>
      <button class="boton boton--chico" type="button" @click="cerrarSesion">Cerrar sesión</button>
    </div>
  </header>
  <div id="contenido" ref="contenido" tabindex="-1" class="contenido">
    <div v-if="errorInesperado" class="pagina">
      <AvisoMensaje tipo="error">
        Algo salió mal. Recargá la página y, si vuelve a pasar, probá de nuevo más tarde.
      </AvisoMensaje>
    </div>
    <RouterView />
  </div>
  <p class="solo-lectores" aria-live="polite">{{ anuncio }}</p>
  <AvisoCelebracion />
</template>

<style>
/*
 * Base visual: variables de diseño (colores, espaciado, tipografía) y estilos comunes. Los neutros
 * son grises sin tinte, para no sugerir clima, y el turquesa es el único color de la aplicación;
 * verde, ámbar y rojo quedan para los estados. El modo oscuro sigue al sistema y repite los
 * contrastes del claro, con las tarjetas apenas más claras que el fondo. Todo cumple AA.
 */
:root {
  color-scheme: light dark;
  --color-texto: #282828;
  --color-texto-secundario: #5e5e5e;
  --color-fondo: #f8f8f8;
  --color-superficie: #ffffff;
  --color-superficie-alt: #f2f2f2;
  --color-borde: #e5e5e5;
  --color-borde-fuerte: #858585;
  --color-acento: #0f766e;
  --color-sobre-acento: #ffffff;
  --color-acento-suave: #e0f2ef;
  --color-exito: #15803d;
  --color-exito-suave: #dcfce7;
  --color-error: #b91c1c;
  --color-error-suave: #fee2e2;
  --color-aviso: #a16207;
  --color-aviso-suave: #fef9c3;
  --color-neutro: #5e5e5e;
  --color-neutro-suave: #f2f2f2;
  --sombra: 0 1px 2px rgb(0 0 0 / 0.05), 0 4px 14px rgb(0 0 0 / 0.06);
  --sombra-elevada: 0 10px 30px rgb(0 0 0 / 0.18);
  --fondo-modal: rgb(0 0 0 / 0.5);
  --fuente-titulos: ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, sans-serif;

  --esp-1: 0.25rem;
  --esp-2: 0.5rem;
  --esp-3: 0.75rem;
  --esp-4: 1rem;
  --esp-5: 1.5rem;
  --esp-6: 2rem;
  --radio: 10px;
  --radio-grande: 18px;
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
    --color-texto: #e8e8e8;
    --color-texto-secundario: #9b9b9b;
    --color-fondo: #1c1c1c;
    --color-superficie: #222222;
    --color-superficie-alt: #2b2b2b;
    --color-borde: #333333;
    --color-borde-fuerte: #717171;
    --color-acento: #2dd4bf;
    --color-sobre-acento: #0b1f1d;
    --color-acento-suave: #12322f;
    --color-exito: #4ade80;
    --color-exito-suave: #12301f;
    --color-error: #f87171;
    --color-error-suave: #351717;
    --color-aviso: #facc15;
    --color-aviso-suave: #332b0c;
    --color-neutro: #9b9b9b;
    --color-neutro-suave: #2b2b2b;
    --sombra: 0 1px 2px rgb(0 0 0 / 0.35), 0 4px 14px rgb(0 0 0 / 0.25);
    --sombra-elevada: 0 10px 30px rgb(0 0 0 / 0.5);
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
  /* Un link pegado o un nombre sin espacios se corta en lugar de salirse de la pantalla. */
  overflow-wrap: anywhere;
}
h1,
h2,
h3,
h4 {
  font-family: var(--fuente-titulos);
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
  font-family: var(--fuente-titulos);
  font-weight: 800;
  color: inherit;
  text-decoration: none;
}
.marca__icono {
  color: var(--color-acento);
}
.usuario {
  display: flex;
  gap: var(--esp-3);
  align-items: center;
}
.usuario__nombre {
  color: var(--color-texto-secundario);
}
.marca,
.usuario .boton {
  white-space: nowrap;
}
.marca__corto {
  display: none;
}
/* En celular el encabezado entra en una línea: marca corta y sin el nombre de quien usa la app. */
@media (max-width: 47.99rem) {
  .marca__largo,
  .usuario__nombre {
    display: none;
  }
  .marca__corto {
    display: inline;
  }
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--esp-2);
  min-height: var(--alto-control);
  padding: var(--esp-2) var(--esp-4);
  border-radius: 999px;
  border: 1px solid var(--color-borde-fuerte);
  background: var(--color-superficie);
  color: var(--color-texto);
  font-weight: 600;
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
/*
 * Acción principal de una sección: en escritorio es un botón con texto; en celular flota abajo a
 * la derecha, redondo y con solo el ícono, encima de la barra de navegación. El texto sigue ahí
 * para los lectores de pantalla.
 */
@media (max-width: 47.99rem) {
  .accion-flotante {
    position: fixed;
    z-index: 25;
    right: var(--esp-4);
    bottom: calc(var(--alto-barra-inferior) + env(safe-area-inset-bottom) + var(--esp-4));
    width: 3.5rem;
    height: 3.5rem;
    padding: 0;
    box-shadow: var(--sombra-elevada);
  }
  /* Lugar para que el último elemento de la lista no quede debajo del botón. */
  .pagina.con-barra-inferior:has(.accion-flotante) {
    padding-bottom: calc(var(--alto-barra-inferior) + env(safe-area-inset-bottom) + 6rem);
  }
  .accion-flotante__texto {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
/* Monto protagonista, como en una app de pagos: grande, centrado y con el símbolo adelante. */
.monto-grande {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--esp-2);
  padding: var(--esp-3) var(--esp-4);
  border: 1px solid var(--color-borde-fuerte);
  border-radius: var(--radio-grande);
  background: var(--color-superficie);
}
.monto-grande:focus-within {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}
.monto-grande__simbolo {
  font-family: var(--fuente-titulos);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-texto-secundario);
}
.monto-grande input {
  width: 100%;
  min-width: 0;
  max-width: 14rem;
  border: none;
  background: transparent;
  padding: 0;
  font-family: var(--fuente-titulos);
  font-size: 2.25rem;
  font-weight: 800;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.monto-grande input:focus {
  outline: none;
}
.monto-grande:has(input[aria-invalid='true']) {
  border-color: var(--color-error);
}
.saltar {
  position: absolute;
  left: var(--esp-3);
  top: -100%;
  z-index: 50;
  padding: var(--esp-2) var(--esp-4);
  border-radius: var(--radio);
  background: var(--color-acento);
  color: var(--color-sobre-acento);
}
.saltar:focus {
  top: var(--esp-2);
}
.contenido:focus {
  outline: none;
}
/* Oculta un texto a la vista y lo deja para los lectores de pantalla. */
/*
 * Crédito del mapa (Leaflet): el enlace se subraya y toma el color del texto de alrededor, así se
 * distingue sin depender del color en los dos modos (el recuadro de Leaflet siempre es claro).
 */
.leaflet-container .leaflet-control-attribution a {
  color: inherit;
  text-decoration: underline;
}
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
