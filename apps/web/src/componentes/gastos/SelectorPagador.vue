<script setup lang="ts">
import type { Participante } from '@viajes/compartido';
import CampoFormulario from '../base/CampoFormulario.vue';
import { nombreVisible } from '../../utiles/formato';

/** RN-G2 (P12): un único pagador; la vista lo inicia con quien anota el gasto. */
defineProps<{ participantes: Participante[]; miId: string }>();
const pagador = defineModel<string>({ required: true });
</script>

<template>
  <CampoFormulario id="gasto-pagador" etiqueta="¿Quién pagó?">
    <select id="gasto-pagador" v-model="pagador">
      <option v-for="p in participantes" :key="p.usuarioId" :value="p.usuarioId">
        {{ p.usuarioId === miId ? 'Yo' : nombreVisible(p) }}
      </option>
    </select>
  </CampoFormulario>
</template>
