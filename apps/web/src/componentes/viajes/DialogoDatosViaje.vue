<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  FECHA_MAXIMA_VIAJE,
  FECHA_MINIMA_VIAJE,
  LARGOS_MAXIMOS,
  elegirPlan,
  esquemaDatosViaje,
  quedanAfuera,
  unAnioDespues,
  type PropuestaFueraDeFechas,
} from '@viajes/compartido';
import AvisoMensaje from '../base/AvisoMensaje.vue';
import CampoFormulario from '../base/CampoFormulario.vue';
import DialogoModal from '../base/DialogoModal.vue';
import PropuestasAfuera from './PropuestasAfuera.vue';
import { ErrorDeApi, mensajeDeError } from '../../clientes/http';
import { useValidacion } from '../../composables/useValidacion';
import { usePropuestasStore } from '../../stores/propuestas';
import { useViajeStore } from '../../stores/viajes';
import { problemasSegun } from '../../utiles/formularios';
import { semanasCorridas } from '../../utiles/formato';

/**
 * CU27: el Admin cambia el nombre, el destino y las fechas. Antes de guardar se ve qué va a pasar
 * con las propuestas (RN-V2), con la misma regla que aplica el servidor.
 */
const emit = defineEmits<{ cerrar: []; guardado: [mensaje: string] }>();
const store = useViajeStore();
const propuestas = usePropuestasStore();
const viaje = store.actual!;

const datos = reactive({
  nombre: viaje.nombre,
  destino: viaje.destino,
  fechaInicio: viaje.fechaInicio,
  fechaFin: viaje.fechaFin,
});
const { errores, alSalir, validarTodo, aria } = useValidacion(
  () => problemasSegun(esquemaDatosViaje, datos),
  datos,
);
const error = ref('');
const enviando = ref(false);
/** Si el servidor encontró propuestas afuera que la pantalla no conocía (RN-V3). */
const afueraSegunServidor = ref<PropuestaFueraDeFechas[] | null>(null);
/** Sin las propuestas cargadas no se anticipa nada y decide el servidor. */
const cargadas = ref(false);

onMounted(() =>
  propuestas
    .cargarTodo()
    .then(() => (cargadas.value = true))
    .catch(() => undefined),
);

/** RN-X7: hasta un año después del inicio, sin pasar el último día admitido. */
const ultimoDiaPosible = computed(() => {
  if (!datos.fechaInicio) return FECHA_MAXIMA_VIAJE;
  const unAnio = unAnioDespues(datos.fechaInicio);
  return unAnio < FECHA_MAXIMA_VIAJE ? unAnio : FECHA_MAXIMA_VIAJE;
});

/** Lo pendiente o confirmado, que tiene que seguir dentro del viaje (RN-V3). */
const enJuego = computed<PropuestaFueraDeFechas[]>(() => [
  ...propuestas.alojamientos
    .filter((a) => a.estado === 'PENDIENTE' || a.estado === 'CONFIRMADA')
    .map((a) => ({
      id: a.id,
      tipo: 'ALOJAMIENTO' as const,
      titulo: a.alojamiento.nombre,
      desde: a.alojamiento.fechaDesde,
      hasta: a.alojamiento.fechaHasta,
    })),
  ...propuestas.actividades
    .filter((a) => a.estado === 'PENDIENTE' || a.estado === 'CONFIRMADA')
    .map((a) => ({
      id: a.id,
      tipo: 'ACTIVIDAD' as const,
      titulo: a.actividad.titulo,
      desde: a.actividad.fecha,
      hasta: a.actividad.fecha,
    })),
]);

/** Qué pasaría al guardar con las fechas elegidas, si son válidas. */
const anticipo = computed(() => {
  if (!cargadas.value || !esquemaDatosViaje.safeParse(datos).success) return null;
  const antes = { desde: viaje.fechaInicio, hasta: viaje.fechaFin };
  const despues = { desde: datos.fechaInicio, hasta: datos.fechaFin };
  const elegido = elegirPlan(antes, despues, enJuego.value);
  if (elegido) return { semanas: elegido.semanas, afuera: [] };
  return { semanas: 0, afuera: quedanAfuera({}, despues, enJuego.value) };
});
const afuera = computed(() => afueraSegunServidor.value ?? anticipo.value?.afuera ?? []);

async function guardar() {
  error.value = '';
  if (!validarTodo() || afuera.value.length > 0 || enviando.value) return;
  enviando.value = true;
  try {
    const { semanas, movidas } = await store.modificarDatos({ ...datos });
    if (movidas > 0) await propuestas.cargarTodo().catch(() => undefined);
    emit(
      'guardado',
      semanas
        ? `Se guardaron los datos del viaje. Las propuestas se corrieron ${semanasCorridas(semanas)}.`
        : 'Se guardaron los datos del viaje.',
    );
  } catch (e) {
    if (e instanceof ErrorDeApi && e.codigo === 'REACOMODO_NECESARIO') {
      afueraSegunServidor.value = (
        e.detalles as { propuestas: PropuestaFueraDeFechas[] }
      ).propuestas;
    } else if (e instanceof ErrorDeApi && Object.keys(e.erroresPorCampo).length > 0) {
      errores.value = e.erroresPorCampo;
    } else error.value = mensajeDeError(e);
  } finally {
    enviando.value = false;
  }
}

/** Al cambiar las fechas, lo que dijo el servidor sobre las anteriores ya no vale. */
function alCambiarFechas() {
  afueraSegunServidor.value = null;
}
</script>

<template>
  <DialogoModal titulo="Datos del viaje" @cerrar="emit('cerrar')">
    <form novalidate @submit.prevent="guardar" @focusout="alSalir">
      <CampoFormulario id="datos-nombre" etiqueta="Nombre" :error="errores['nombre']">
        <input
          id="datos-nombre"
          v-bind="aria('nombre', 'datos-nombre')"
          v-model="datos.nombre"
          :maxlength="LARGOS_MAXIMOS.nombreViaje"
          name="nombre"
        />
      </CampoFormulario>
      <CampoFormulario id="datos-destino" etiqueta="Destino" :error="errores['destino']">
        <input
          id="datos-destino"
          v-bind="aria('destino', 'datos-destino')"
          v-model="datos.destino"
          :maxlength="LARGOS_MAXIMOS.destino"
          name="destino"
        />
      </CampoFormulario>
      <div class="fila">
        <CampoFormulario id="datos-inicio" etiqueta="Desde" :error="errores['fechaInicio']">
          <input
            id="datos-inicio"
            v-bind="aria('fechaInicio', 'datos-inicio')"
            v-model="datos.fechaInicio"
            name="fechaInicio"
            type="date"
            :min="FECHA_MINIMA_VIAJE"
            :max="FECHA_MAXIMA_VIAJE"
            @input="alCambiarFechas"
          />
        </CampoFormulario>
        <CampoFormulario id="datos-fin" etiqueta="Hasta" :error="errores['fechaFin']">
          <input
            id="datos-fin"
            v-bind="aria('fechaFin', 'datos-fin')"
            v-model="datos.fechaFin"
            name="fechaFin"
            type="date"
            :min="datos.fechaInicio || FECHA_MINIMA_VIAJE"
            :max="ultimoDiaPosible"
            @input="alCambiarFechas"
          />
        </CampoFormulario>
      </div>
      <PropuestasAfuera v-if="afuera.length" :propuestas="afuera" :viaje-id="viaje.id" />
      <AvisoMensaje v-else-if="anticipo?.semanas" tipo="info"
        >Al guardar, las propuestas se corren {{ semanasCorridas(anticipo.semanas) }}.</AvisoMensaje
      >
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <div class="acciones">
        <button type="button" class="boton" @click="emit('cerrar')">Cancelar</button>
        <button
          type="submit"
          class="boton boton--principal"
          :disabled="enviando || afuera.length > 0"
        >
          Guardar
        </button>
      </div>
    </form>
  </DialogoModal>
</template>

<style scoped>
.afuera,
.aviso {
  margin-bottom: var(--esp-4);
}
</style>
