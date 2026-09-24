<script setup lang="ts">
import type { ModoDivision } from '@viajes/compartido';

const modo = defineModel<ModoDivision>({ required: true });
</script>

<template>
  <fieldset class="selector-modo">
    <legend>¿Cómo se divide?</legend>
    <label><input v-model="modo" type="radio" value="IGUALES" /> En partes iguales</label>
    <label
      ><input v-model="modo" type="radio" value="ARBITRARIA" /> Indico cuánto paga cada uno</label
    >
  </fieldset>
</template>

<style scoped>
.selector-modo {
  border: none;
  padding: 0;
  margin: 0 0 0.75rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
legend {
  margin-bottom: 0.3rem;
}
</style>
