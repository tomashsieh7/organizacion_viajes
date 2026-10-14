<script setup lang="ts">
import { useCelebracion } from '../../composables/useCelebracion';

const { celebracion, cerrar } = useCelebracion();
/** Posiciones fijas de la lluvia de emojis; con "reducir movimiento" no se muestra. */
const PARTICULAS = [
  { emoji: '🎉', izquierda: 8, demora: 0 },
  { emoji: '✨', izquierda: 22, demora: 120 },
  { emoji: '🎊', izquierda: 38, demora: 60 },
  { emoji: '✨', izquierda: 55, demora: 200 },
  { emoji: '🎉', izquierda: 70, demora: 90 },
  { emoji: '🎊', izquierda: 86, demora: 160 },
];
</script>

<template>
  <!-- La región existe siempre, así los lectores de pantalla anuncian cada mensaje nuevo. -->
  <div class="celebracion" role="status" aria-live="polite">
    <template v-if="celebracion">
      <div :key="celebracion.id" class="lluvia" aria-hidden="true">
        <span
          v-for="(p, i) in PARTICULAS"
          :key="i"
          class="particula"
          :style="{ left: `${p.izquierda}%`, animationDelay: `${p.demora}ms` }"
          >{{ p.emoji }}</span
        >
      </div>
      <p class="mensaje">
        <span aria-hidden="true">🎉</span> {{ celebracion.mensaje }}
        <button type="button" class="cerrar" aria-label="Cerrar" @click="cerrar">×</button>
      </p>
    </template>
  </div>
</template>

<style scoped>
.lluvia {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 60;
  overflow: hidden;
}
.particula {
  position: absolute;
  top: -2rem;
  font-size: 1.6rem;
  animation: caer 1.8s ease-in forwards;
}
@keyframes caer {
  to {
    transform: translateY(70vh) rotate(200deg);
    opacity: 0;
  }
}
.mensaje {
  position: fixed;
  z-index: 61;
  left: 50%;
  bottom: var(--esp-5);
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--esp-2);
  width: max-content;
  max-width: calc(100% - 2 * var(--esp-4));
  margin: 0;
  padding: var(--esp-3) var(--esp-3) var(--esp-3) var(--esp-4);
  border-radius: var(--radio-grande);
  background: var(--color-texto);
  color: var(--color-fondo);
  font-weight: 700;
  box-shadow: var(--sombra-elevada);
}
.cerrar {
  min-width: 2.25rem;
  min-height: 2.25rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
}
@media (max-width: 47.99rem) {
  .mensaje {
    bottom: calc(var(--alto-barra-inferior) + env(safe-area-inset-bottom) + var(--esp-3));
  }
}
@media (prefers-reduced-motion: reduce) {
  .lluvia {
    display: none;
  }
}
</style>
