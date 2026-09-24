<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import { CLIENTE_SALUD } from '../clientes/salud';

type Estado = 'consultando' | 'disponible' | 'no-disponible';

const cliente = inject(CLIENTE_SALUD);
if (!cliente) throw new Error('Falta inyectar ClienteSalud');

const estado = ref<Estado>('consultando');

onMounted(async () => {
  try {
    await cliente.consultar();
    estado.value = 'disponible';
  } catch {
    estado.value = 'no-disponible';
  }
});
</script>

<template>
  <main class="inicio">
    <h1>Organizador de viajes</h1>
    <p class="estado" :data-estado="estado">
      <template v-if="estado === 'consultando'">Consultando el servidor…</template>
      <template v-else-if="estado === 'disponible'">Servidor disponible</template>
      <template v-else>No se pudo contactar al servidor</template>
    </p>
  </main>
</template>

<style scoped>
.inicio {
  max-width: 40rem;
  margin: 4rem auto;
  padding: 0 1rem;
}
.estado[data-estado='disponible'] {
  color: var(--color-exito);
}
.estado[data-estado='no-disponible'] {
  color: var(--color-error);
}
</style>
