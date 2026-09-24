<script setup lang="ts">
import type { Participante } from '@viajes/compartido';
import { nombreVisible } from '../../utiles/formato';

defineProps<{ candidatos: Participante[] }>();
const modelo = defineModel<string>({ required: true });
</script>

<template>
  <label for="sucesor">Nuevo Admin</label>
  <select id="sucesor" v-model="modelo">
    <option value="" disabled>Elegí a un participante</option>
    <option v-for="p in candidatos" :key="p.usuarioId" :value="p.usuarioId">
      {{ nombreVisible(p) }}
    </option>
  </select>
</template>
