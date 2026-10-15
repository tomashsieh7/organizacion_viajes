<script setup lang="ts">
/**
 * Íconos de línea de un solo color: toman el color del texto que los rodea (`currentColor`), así
 * no suman tonos a la pantalla. Son decorativos; el significado siempre lo lleva el texto.
 * Cada ícono es una lista de trazos (atributo `d` de un `path`) en una grilla de 24 × 24.
 */
const TRAZOS = {
  casa: ['M3 11l9-7 9 7', 'M5 10v10h14V10'],
  votar: [
    'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-10a3 3 0 0 1 3 -3z',
    'M9 12l2 2 4-4',
  ],
  calendario: [
    'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z',
    'M3 10h18M8 3v4M16 3v4',
  ],
  chat: ['M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'],
  cuentas: [
    'M5 6h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2z',
    'M3 10h18M16 15h2',
  ],
  pin: [
    'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z',
    'M9.5 10a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0',
  ],
  personas: [
    'M5.5 8a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0',
    'M2.5 20a6.5 6.5 0 0 1 13 0',
    'M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6',
  ],
  reloj: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 7v5l3 2'],
  cama: ['M3 18V7M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6', 'M5 11a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'],
  mapa: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z', 'M9 4v14M15 6v14'],
  bandeja: ['M3 13h5l2 3h4l2-3h5', 'M5 5h14l2 8v6H3v-6z'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  cruz: ['M6 6l12 12M18 6L6 18'],
  'flecha-izquierda': ['M15 5l-7 7 7 7'],
  'flecha-derecha': ['M9 5l7 7-7 7'],
  prohibido: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M5.6 5.6l12.8 12.8'],
  'a-favor': [
    'M7 11v9H4v-9h3z',
    'M7 11l4-7a2 2 0 0 1 3 2l-1 4h5.5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.3 20H7',
  ],
  'en-contra': [
    'M7 13V4H4v9h3z',
    'M7 13l4 7a2 2 0 0 0 3-2l-1-4h5.5a2 2 0 0 0 2-2.3l-1.2-6A2 2 0 0 0 17.3 4H7',
  ],
} as const satisfies Record<string, readonly string[]>;

export type NombreIcono = keyof typeof TRAZOS;

withDefaults(defineProps<{ nombre: NombreIcono; tamano?: number }>(), { tamano: 18 });
</script>

<template>
  <svg
    class="icono"
    :width="tamano"
    :height="tamano"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(d, i) in TRAZOS[nombre]" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.icono {
  flex: none;
  vertical-align: -0.2em;
}
</style>
