<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AvisoCelebracion from './componentes/base/AvisoCelebracion.vue';
import AvisoMensaje from './componentes/base/AvisoMensaje.vue';
import IconoLinea from './componentes/base/IconoLinea.vue';
import SelectorTema from './componentes/base/SelectorTema.vue';
import { useTema } from './composables/useTema';
import { useSesionStore } from './stores/sesion';

const sesion = useSesionStore();
const router = useRouter();
const route = useRoute();
const contenido = ref<HTMLElement | null>(null);
/** Lo que anuncia el lector de pantalla al cambiar de página, sin mover el foco. */
const anuncio = ref('');
/** Un error que ningún componente manejó: se avisa en lugar de dejar la pantalla a medias. */
const errorInesperado = ref(false);
useTema().iniciar();

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
    <div class="usuario">
      <span v-if="sesion.usuario" class="usuario__nombre">{{ sesion.usuario.nombre }}</span>
      <SelectorTema />
      <button v-if="sesion.usuario" class="boton boton--chico" type="button" @click="cerrarSesion">
        Cerrar sesión
      </button>
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
 * Base visual: variables de diseño (colores, espaciado, tipografía) y estilos comunes. En claro, fondo
 * crema con tarjetas casi blancas; en oscuro, la paleta "Noche petróleo". La mostaza es el color
 * de la acción principal (botones principales, botón flotante e ícono de la marca); el verde
 * azulado, el de los enlaces, las pestañas y los detalles que acompañan el viaje (cuenta regresiva,
 * progreso y franjas), y su versión oscura va en la barra de arriba. Verde, naranja tostado y rojo
 * quedan para los estados; la mostaza nunca se usa en montos ni en estados.
 * El modo lo elige cada dispositivo (`useTema`) con `data-tema` en `<html>`. Todo cumple AA.
 */
:root {
  color-scheme: light;
  --color-texto: #1c2230;
  --color-texto-secundario: #59606e;
  --color-fondo: #faf6ee;
  --color-superficie: #fffdf8;
  --color-superficie-alt: #f3eee4;
  --color-borde: #ddd5c6;
  --color-borde-fuerte: #8a8478;
  --color-acento: #0a6a77;
  --color-sobre-acento: #ffffff;
  --color-acento-suave: #dff1f2;
  --color-barra: #083a46;
  --color-sobre-barra: #ffffff;
  --color-sobre-barra-secundario: #cfe3e7;
  --color-destacado: #0a6a77;
  --color-sobre-destacado: #ffffff;
  --color-accion: #f2b53a;
  --color-sobre-accion: #2b1d00;
  --color-accion-suave: #fdf1d6;
  --color-accion-borde: #c98f17;
  --color-exito: #15803d;
  --color-exito-suave: #dcfce7;
  --color-error: #b91c1c;
  --color-error-suave: #fee2e2;
  --color-aviso: #9a4a00;
  --color-aviso-suave: #ffedd8;
  --color-neutro: #59606e;
  --color-neutro-suave: #f3eee4;
  --sombra-elevada: 0 10px 30px rgb(0 0 0 / 0.18);
  --fondo-modal: rgb(0 0 0 / 0.5);
  --fuente-titulos: 'Poppins', system-ui, sans-serif;
  --fuente-texto: 'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

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
  /* Alto del encabezado de la aplicación: un control más su relleno. */
  --alto-encabezado: calc(var(--alto-control) + 2 * var(--esp-2));
  --duracion: 150ms;

  font-family: var(--fuente-texto);
  font-size: 100%;
  line-height: 1.5;
  color: var(--color-texto);
  background: var(--color-fondo);
  -webkit-text-size-adjust: 100%;
}
/*
 * Modo oscuro "Carbón": grises neutros, tarjetas más claras que el fondo con borde visible,
 * celeste para enlaces y pestañas, celeste pastel con texto oscuro para la cuenta regresiva, y la
 * misma mostaza para la acción principal. El contraste AA está calculado sobre estos fondos.
 */
:root[data-tema='oscuro'] {
  color-scheme: dark;
  --color-texto: #f2f2f2;
  --color-texto-secundario: #b8b8b8;
  --color-fondo: #1f1f1f;
  --color-superficie: #333333;
  --color-superficie-alt: #3d3d3d;
  --color-borde: #6e6e6e;
  --color-borde-fuerte: #9a9a9a;
  --color-acento: #3fc3d8;
  --color-sobre-acento: #062a30;
  --color-acento-suave: #1d3d42;
  --color-barra: #1f1f1f;
  --color-sobre-barra: #f2f2f2;
  --color-sobre-barra-secundario: #b8b8b8;
  --color-destacado: #a9d5dd;
  --color-sobre-destacado: #12343a;
  --color-accion: #f2b53a;
  --color-sobre-accion: #2b1d00;
  --color-accion-suave: rgb(0 0 0 / 0.08);
  --color-accion-borde: rgb(255 255 255 / 0.16);
  --color-exito: #62d48e;
  --color-exito-suave: #22402e;
  --color-error: #ff8099;
  --color-error-suave: #4a2830;
  --color-aviso: #ffa463;
  --color-aviso-suave: #4a3221;
  --color-neutro: #b8b8b8;
  --color-neutro-suave: #3d3d3d;
  --sombra-elevada: 0 10px 30px rgb(0 0 0 / 0.6);
  --fondo-modal: rgb(0 0 0 / 0.7);
}
/* En oscuro la barra es del color del fondo; una línea gris la separa del contenido. */
:root[data-tema='oscuro'] .barra {
  border-bottom-color: var(--color-borde);
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
  border-bottom: 1px solid var(--color-barra);
  background: var(--color-barra);
  color: var(--color-sobre-barra);
}
.barra :focus-visible {
  outline-color: var(--color-sobre-barra);
}
.barra .boton {
  background: transparent;
  border-color: var(--color-sobre-barra);
  color: var(--color-sobre-barra);
}
.barra .boton:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.12);
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
  color: var(--color-accion);
}
.usuario {
  display: flex;
  gap: var(--esp-3);
  align-items: center;
}
.usuario__nombre {
  color: var(--color-sobre-barra-secundario);
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
  padding: var(--esp-4);
}
.formulario {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  padding: var(--esp-5) var(--esp-4);
}
/*
 * Formularios con mapa: en escritorio, los campos a la izquierda y la ubicación con su mapa a la
 * derecha. El mapa ocupa varias filas para que los campos no queden separados por su altura.
 */
@media (min-width: 64rem) {
  .formulario--con-mapa {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--esp-6);
    align-items: start;
  }
  .formulario--con-mapa > * {
    grid-column: 1;
  }
  .formulario--con-mapa > .ubicacion {
    grid-column: 2;
    grid-row: 1 / span 8;
  }
  .formulario--con-mapa > .acciones {
    grid-column: 1 / -1;
  }
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

/*
 * Grillas de contenido: una columna en celular y tablet; en escritorio (desde 64rem), las listas de
 * tarjetas pasan a dos columnas y las pantallas con dos bloques los ponen uno al lado del otro.
 */
.grilla {
  display: grid;
  /* Entre filas separa el margen propio de cada tarjeta. */
  column-gap: var(--esp-4);
  align-items: start;
}
.grilla > * {
  min-width: 0;
}
@media (min-width: 64rem) {
  .grilla--doble {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  /*
   * Tarjetas parejas por fila: las dos de cada fila miden lo mismo, con los votos y botones
   * alineados abajo; la descripción larga se corta en dos renglones y al tocarla se ve entera.
   */
  .grilla--pareja {
    align-items: stretch;
  }
  .grilla--pareja .descripcion:not(.descripcion--abierta) {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    cursor: pointer;
  }
  /* Un bloque angosto fijo (calendario, billetera, totales) y el resto del ancho para el detalle. */
  .grilla--lateral {
    grid-template-columns: 22rem minmax(0, 1fr);
  }
  /*
   * El calendario es una ayuda para elegir el día, no lo principal: en escritorio va a la derecha
   * y queda a la vista al bajar. En el DOM va primero, así en celular queda arriba. Un bloque
   * `.grilla__arriba` opcional (el filtro de Actividades) ocupa todo el ancho por encima.
   */
  .grilla--calendario {
    grid-template-columns: minmax(0, 1fr) 22rem;
    grid-template-areas: 'contenido calendario';
  }
  .grilla--calendario:has(> .grilla__arriba) {
    grid-template-areas:
      'arriba arriba'
      'contenido calendario';
  }
  .grilla--calendario > :first-child {
    grid-area: calendario;
    align-self: start;
    position: sticky;
    top: calc(var(--alto-encabezado) + var(--esp-4));
  }
  .grilla--calendario > .grilla__arriba {
    grid-area: arriba;
  }
  .grilla--calendario > :last-child:not(:first-child) {
    grid-area: contenido;
  }
}

/*
 * Agenda de un día (Cronograma y Mapa): cada actividad es un renglón con su número, el mismo del
 * marcador en el mapa, el horario en una columna fija y el título con la ubicación debajo.
 */
.agenda {
  list-style: none;
  margin: 0;
  padding: 0;
}
.agenda__fila {
  display: grid;
  grid-template-columns: 1.75rem 7.5rem minmax(0, 1fr);
  gap: var(--esp-1) var(--esp-3);
  align-items: baseline;
  padding: var(--esp-2) 0;
}
.agenda__fila + .agenda__fila {
  border-top: 1px solid var(--color-borde);
}
.agenda__numero {
  display: inline-grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: var(--color-acento);
  color: var(--color-sobre-acento);
  font-size: 0.85rem;
  font-weight: 700;
  align-self: center;
}
.agenda__numero--sigue {
  background: var(--color-superficie-alt);
  color: var(--color-texto-secundario);
}
.agenda__hora {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.agenda__texto {
  display: flex;
  flex-direction: column;
}
.agenda__detalle {
  font-size: 0.875rem;
  color: var(--color-texto-secundario);
}
/* En celular el horario pasa arriba del título para dejarle el ancho. */
@media (max-width: 29.99rem) {
  .agenda__fila {
    grid-template-columns: 1.75rem minmax(0, 1fr);
  }
  .agenda__texto {
    grid-column: 2;
  }
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
  background: var(--color-accion);
  border-color: var(--color-accion);
  color: var(--color-sobre-accion);
}
.boton--principal:hover:not(:disabled) {
  background: var(--color-accion);
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
  /* Junto a un título largo, la etiqueta no se achica ni se parte en letras sueltas. */
  flex-shrink: 0;
  white-space: nowrap;
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
    border-color: var(--color-accion);
    background: var(--color-accion);
    color: var(--color-sobre-accion);
    box-shadow: var(--sombra-elevada);
  }
  .accion-flotante:hover:not(:disabled) {
    background: var(--color-accion);
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
