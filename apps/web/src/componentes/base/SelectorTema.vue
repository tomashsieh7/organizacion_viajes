<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import IconoLinea, { type NombreIcono } from './IconoLinea.vue';
import { type PreferenciaTema, useTema } from '../../composables/useTema';

const { preferencia, oscuro, elegir } = useTema();
const abierto = ref(false);
const raiz = ref<HTMLElement | null>(null);
const boton = ref<HTMLButtonElement | null>(null);

const OPCIONES: { valor: PreferenciaTema; texto: string; icono: NombreIcono }[] = [
  { valor: 'claro', texto: 'Claro', icono: 'sol' },
  { valor: 'oscuro', texto: 'Oscuro', icono: 'luna' },
  { valor: 'automatico', texto: 'Automático', icono: 'automatico' },
];
const actual = computed(() => OPCIONES.find((o) => o.valor === preferencia.value) ?? OPCIONES[2]!);
/** El botón muestra el modo que se ve, también en automático: sol en claro y luna en oscuro. */
const iconoBoton = computed<NombreIcono>(() => (oscuro.value ? 'luna' : 'sol'));

function alTocarAfuera(e: PointerEvent) {
  if (raiz.value && !raiz.value.contains(e.target as Node)) cerrar();
}

function abrir() {
  abierto.value = true;
  document.addEventListener('pointerdown', alTocarAfuera);
}

function cerrar(devolverFoco = false) {
  abierto.value = false;
  document.removeEventListener('pointerdown', alTocarAfuera);
  if (devolverFoco) boton.value?.focus();
}

function seleccionar(valor: PreferenciaTema) {
  elegir(valor);
  cerrar(true);
}

onBeforeUnmount(() => document.removeEventListener('pointerdown', alTocarAfuera));
</script>

<template>
  <!-- Botón que despliega las tres opciones; Escape lo cierra y devuelve el foco al botón. -->
  <div ref="raiz" class="tema" @keydown.esc="cerrar(true)">
    <button
      ref="boton"
      type="button"
      class="boton boton--chico tema__boton"
      :aria-expanded="abierto"
      aria-controls="opciones-tema"
      @click="abierto ? cerrar() : abrir()"
    >
      <IconoLinea :nombre="iconoBoton" :tamano="18" />
      <span class="solo-lectores">Modo: {{ actual.texto }}</span>
    </button>
    <ul v-if="abierto" id="opciones-tema" class="tema__opciones" aria-label="Modo de color">
      <li v-for="o in OPCIONES" :key="o.valor">
        <button
          type="button"
          class="tema__opcion"
          :aria-pressed="o.valor === preferencia"
          @click="seleccionar(o.valor)"
        >
          <IconoLinea :nombre="o.icono" :tamano="18" />
          {{ o.texto }}
          <IconoLinea
            v-if="o.valor === preferencia"
            nombre="check"
            :tamano="16"
            class="tema__tilde"
          />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tema {
  position: relative;
}
.tema__boton {
  width: 2.25rem;
  padding: 0;
}
.tema__opciones {
  position: absolute;
  right: 0;
  top: calc(100% + var(--esp-2));
  z-index: 30;
  min-width: 11rem;
  list-style: none;
  margin: 0;
  padding: var(--esp-1);
  background: var(--color-superficie);
  color: var(--color-texto);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
  box-shadow: var(--sombra-elevada);
}
.tema__opcion {
  display: flex;
  align-items: center;
  gap: var(--esp-2);
  width: 100%;
  min-height: var(--alto-control);
  padding: 0 var(--esp-3);
  border: none;
  border-radius: calc(var(--radio) - 4px);
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.tema__opciones :focus-visible {
  /* La barra usa un foco claro; sobre el desplegable hace falta el del resto de la página. */
  outline-color: var(--color-acento);
}
.tema__opcion:hover {
  background: var(--color-superficie-alt);
}
.tema__opcion[aria-pressed='true'] {
  font-weight: 600;
}
.tema__tilde {
  margin-left: auto;
  color: var(--color-acento);
}
</style>
