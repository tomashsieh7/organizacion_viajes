<script setup lang="ts">
import { computed } from 'vue';

/**
 * Monto protagonista, como en Mercado Pago: sin recuadro, el número grande en el medio, el símbolo
 * y los centavos chicos y arriba, y una línea debajo. Lo que se escribe va a un campo real,
 * invisible y del tamaño de todo el monto (teclado numérico, lectores de pantalla y pegado
 * funcionan igual); lo que se ve es su copia con formato. Los atributos (id, name, aria-*) pasan
 * al campo.
 */
defineOptions({ inheritAttrs: false });
defineProps<{ simbolo: string }>();
const texto = defineModel<string>({ required: true });

/** "12345,6" se ve como 12.345 con los centavos 6 arriba; un texto que no es un número, tal cual. */
const partes = computed(() => {
  const t = texto.value.trim();
  if (!t) return null;
  const coma = t.lastIndexOf(',');
  const entero = coma < 0 ? t : t.slice(0, coma);
  const digitos = entero.replace(/\./g, '');
  return {
    entero: /^\d+$/.test(digitos) ? digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : entero,
    centavos: coma < 0 ? null : t.slice(coma + 1),
  };
});
/** Con montos largos el número se achica para seguir entrando en un celular. */
const tamano = computed(() => {
  const largo = (partes.value?.entero.length ?? 1) + (partes.value?.centavos?.length ?? 0);
  return largo > 12 ? '2rem' : largo > 9 ? '2.5rem' : '3.25rem';
});
</script>

<template>
  <div class="monto-grande" :class="{ 'monto-grande--vacio': !partes }">
    <span class="monto-grande__visible" aria-hidden="true">
      <span class="monto-grande__chico">{{ simbolo }}</span>
      <span class="monto-grande__entero" :style="{ fontSize: tamano }">{{
        partes?.entero ?? '0'
      }}</span>
      <!-- Con la coma escrita y sin centavos todavía, se insinúan los dos dígitos que faltan. -->
      <span
        v-if="partes && partes.centavos !== null"
        class="monto-grande__chico"
        :class="{ 'monto-grande__chico--pendiente': !partes.centavos }"
        >{{ partes.centavos || '00' }}</span
      >
      <span class="monto-grande__cursor"></span>
    </span>
    <input
      v-model="texto"
      v-bind="$attrs"
      class="monto-grande__campo"
      inputmode="decimal"
      autocomplete="off"
    />
  </div>
</template>

<style scoped>
.monto-grande {
  position: relative;
  display: flex;
  justify-content: center;
  padding: var(--esp-2) 0;
}
.monto-grande__visible {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--esp-1);
  min-width: 12rem;
  max-width: 100%;
  justify-content: center;
  padding-bottom: var(--esp-2);
  border-bottom: 2px solid var(--color-borde-fuerte);
  font-family: var(--fuente-titulos);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  overflow-wrap: normal;
}
.monto-grande__entero {
  min-width: 0;
  overflow-wrap: anywhere;
}
.monto-grande__chico {
  font-size: 1.5rem;
  margin-top: 0.35rem;
}
.monto-grande__chico--pendiente,
.monto-grande--vacio .monto-grande__visible {
  color: var(--color-texto-secundario);
}
/* El campo real ocupa todo el monto: tocar en cualquier parte abre el teclado. */
.monto-grande__campo {
  position: absolute;
  inset: 0;
  width: 100%;
  min-height: 0;
  opacity: 0;
  cursor: text;
}
.monto-grande:focus-within .monto-grande__visible {
  border-bottom-color: var(--color-acento);
}
.monto-grande:has(input[aria-invalid='true']) .monto-grande__visible {
  border-bottom-color: var(--color-error);
}
/* Cursor que titila al final del monto mientras se escribe. */
.monto-grande__cursor {
  display: none;
  width: 2px;
  height: 2.75rem;
  margin-top: 0.25rem;
  background: var(--color-acento);
  animation: titilar 1s steps(1) infinite;
}
.monto-grande:focus-within .monto-grande__cursor {
  display: block;
}
@keyframes titilar {
  50% {
    opacity: 0;
  }
}
</style>
