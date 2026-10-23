<script setup lang="ts">
import { ref } from 'vue';
import AvisoMensaje from '../base/AvisoMensaje.vue';
import DialogoDatosViaje from './DialogoDatosViaje.vue';
import { useViajeStore } from '../../stores/viajes';
import { formatearRango } from '../../utiles/formato';

/** CU27: los datos del viaje; el Admin los edita en un diálogo (RN-V1). */
const store = useViajeStore();
const editando = ref(false);
const aviso = ref('');

function alGuardar(mensaje: string) {
  editando.value = false;
  aviso.value = mensaje;
}
</script>

<template>
  <section v-if="store.actual" class="panel datos" aria-labelledby="datos-titulo">
    <div class="datos__encabezado">
      <h3 id="datos-titulo">Datos del viaje</h3>
      <button
        v-if="store.soyAdmin"
        type="button"
        class="boton boton--chico"
        @click="((aviso = ''), (editando = true))"
      >
        Editar
      </button>
    </div>
    <AvisoMensaje v-if="aviso" tipo="exito">{{ aviso }}</AvisoMensaje>
    <dl class="datos__lista">
      <dt>Nombre</dt>
      <dd>{{ store.actual.nombre }}</dd>
      <dt>Destino</dt>
      <dd>{{ store.actual.destino }}</dd>
      <dt>Fechas</dt>
      <dd>{{ formatearRango(store.actual.fechaInicio, store.actual.fechaFin) }}</dd>
      <dt>Moneda</dt>
      <dd>{{ store.actual.moneda.nombre }}</dd>
    </dl>
    <DialogoDatosViaje v-if="editando" @cerrar="editando = false" @guardado="alGuardar" />
  </section>
</template>

<style scoped>
.datos {
  margin-bottom: var(--esp-5);
}
.datos__encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--esp-3);
  margin-bottom: var(--esp-3);
}
.datos__encabezado h3 {
  margin: 0;
}
.datos__lista {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--esp-1) var(--esp-4);
  margin: 0;
}
.datos__lista dt {
  color: var(--color-texto-secundario);
}
.datos__lista dd {
  margin: 0;
  font-weight: 600;
}
</style>
