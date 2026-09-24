<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Participante } from '@viajes/compartido';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import DialogoModal from '../componentes/base/DialogoModal.vue';
import DialogoSalir from '../componentes/viajes/DialogoSalir.vue';
import DialogoTraspaso from '../componentes/viajes/DialogoTraspaso.vue';
import FormularioAgregarViajero from '../componentes/viajes/FormularioAgregarViajero.vue';
import ListaParticipantes from '../componentes/viajes/ListaParticipantes.vue';
import { mensajeDeError } from '../clientes/http';
import { useSesionStore } from '../stores/sesion';
import { useViajeStore } from '../stores/viaje';

const store = useViajeStore();
const sesion = useSesionStore();
const error = ref('');
const aviso = ref('');
const aEliminar = ref<Participante | null>(null);
const dialogo = ref<'traspaso' | 'salir' | null>(null);
const miId = () => sesion.usuario?.id ?? '';

onMounted(() => store.cargarParticipantes().catch((e) => (error.value = mensajeDeError(e))));

async function confirmarEliminacion() {
  const p = aEliminar.value;
  if (!p) return;
  try {
    const { bajaConDeuda } = await store.eliminarParticipante(p.usuarioId);
    aviso.value = bajaConDeuda
      ? `Se eliminó a ${p.nombre}. Tenía deudas pendientes: se conservó su historial de gastos y deudas.`
      : `Se eliminó a ${p.nombre}.`;
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    aEliminar.value = null;
  }
}
</script>

<template>
  <section>
    <h2>Participantes</h2>
    <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <AvisoMensaje v-if="aviso" tipo="exito">{{ aviso }}</AvisoMensaje>
    <ListaParticipantes
      :participantes="store.participantes"
      :soy-admin="store.soyAdmin"
      :mi-id="miId()"
      @eliminar="aEliminar = $event"
    />
    <FormularioAgregarViajero v-if="store.soyAdmin" />
    <div class="acciones">
      <button v-if="store.soyAdmin" class="boton" type="button" @click="dialogo = 'traspaso'">
        Transferir la administración
      </button>
      <button class="boton boton--peligro" type="button" @click="dialogo = 'salir'">
        Salir del grupo
      </button>
    </div>

    <DialogoModal v-if="aEliminar" titulo="Eliminar participante" @cerrar="aEliminar = null">
      <p>
        ¿Eliminar a {{ aEliminar.nombre }} del grupo? Su historial de gastos, deudas y mensajes se
        conserva, y si tiene deudas pendientes las va a poder seguir pagando.
      </p>
      <div class="acciones">
        <button class="boton" type="button" @click="aEliminar = null">Cancelar</button>
        <button class="boton boton--peligro" type="button" @click="confirmarEliminacion">
          Eliminar
        </button>
      </div>
    </DialogoModal>
    <DialogoTraspaso v-if="dialogo === 'traspaso'" :mi-id="miId()" @cerrar="dialogo = null" />
    <DialogoSalir v-if="dialogo === 'salir'" :mi-id="miId()" @cerrar="dialogo = null" />
  </section>
</template>
