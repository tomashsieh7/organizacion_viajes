<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  LARGOS_MAXIMOS,
  esquemaActividadNueva,
  type ActividadVista,
  type ConflictoHorario,
  type DatosActividadNueva,
} from '@viajes/compartido';
import AvisoMensaje from '../../componentes/base/AvisoMensaje.vue';
import CampoFormulario from '../../componentes/base/CampoFormulario.vue';
import AvisoSuperposicion from '../../componentes/actividades/AvisoSuperposicion.vue';
import CampoFechaHora from '../../componentes/actividades/CampoFechaHora.vue';
import CampoUbicacion, {
  type ValorUbicacion,
} from '../../componentes/ubicacion/CampoUbicacion.vue';
import { ErrorDeApi, mensajeDeError } from '../../clientes/http';
import { usePropuestasStore } from '../../stores/propuestas';
import { useViajeStore } from '../../stores/viajes';
import { aUnidadMinima, formatearDuracion, formatearHorario } from '../../utiles/formato';
import { uuidAlAzar } from '../../utiles/uuid';
import { useValidacion } from '../../composables/useValidacion';
import { MONTO_INVALIDO, problemasSegun } from '../../utiles/formularios';

const viaje = useViajeStore();
const propuestas = usePropuestasStore();
const route = useRoute();
const router = useRouter();
const actual = viaje.actual!;

/** CU10 o, si la ruta trae una actividad, CU11 (modo alternativa). */
const originalId =
  typeof route.params['actividadId'] === 'string' ? route.params['actividadId'] : null;
const original = ref<ActividadVista | null>(null);

const datos = reactive({
  titulo: '',
  descripcion: '',
  fecha: actual.fechaInicio,
  horaInicio: '10:00',
  // El campo numérico entrega un número, o texto vacío si se borra.
  duracionMin: 60 as number | string,
  precio: '',
});
const ubicacion = ref<ValorUbicacion>({ ubicacion: '', latitud: null, longitud: null });
const error = ref('');
const conflictos = ref<ConflictoHorario[]>([]);
const enviando = ref(false);
const duracion = computed(() => {
  const n = Number(datos.duracionMin);
  return Number.isInteger(n) && n > 0 ? formatearDuracion(n) : '';
});

onMounted(async () => {
  if (!originalId) return;
  try {
    original.value = await propuestas.obtenerActividad(originalId);
    // La alternativa suele competir por el mismo horario: se parte del de la original.
    const a = original.value.actividad;
    Object.assign(datos, {
      fecha: a.fecha,
      horaInicio: a.horaInicio,
      duracionMin: a.duracionMin,
    });
  } catch (e) {
    error.value = mensajeDeError(e);
  }
});

/** Arma el cuerpo para la API y devuelve sus problemas, con el mismo esquema que valida la API. */
/** Identifica este intento de proponer: si la respuesta se pierde, reintentar no la duplica. */
const idDeLaPropuesta = uuidAlAzar();

function armarCuerpo() {
  const precio =
    datos.precio.trim() === '' ? undefined : aUnidadMinima(datos.precio, actual.moneda.decimales);
  const cuerpo: DatosActividadNueva = {
    id: idDeLaPropuesta,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    ubicacion: ubicacion.value.ubicacion,
    latitud: ubicacion.value.latitud as number,
    longitud: ubicacion.value.longitud as number,
    fecha: datos.fecha,
    horaInicio: datos.horaInicio,
    duracionMin: datos.duracionMin === '' ? Number.NaN : Number(datos.duracionMin),
    ...(precio === undefined || precio === null ? {} : { precio }),
  };
  const problemas = problemasSegun(esquemaActividadNueva, cuerpo);
  if (precio === null) problemas['precio'] = MONTO_INVALIDO;
  return { cuerpo, problemas };
}

const { errores, alSalir, validarTodo, aria } = useValidacion(
  () => armarCuerpo().problemas,
  [datos, ubicacion],
);

async function enviar() {
  error.value = '';
  conflictos.value = [];
  if (!validarTodo()) return;
  const { cuerpo } = armarCuerpo();
  enviando.value = true;
  try {
    if (originalId) await propuestas.proponerAlternativa(originalId, cuerpo);
    else await propuestas.proponerActividad(cuerpo);
    await router.push(`/viajes/${actual.id}/actividades`);
  } catch (e) {
    // RN-A2: el formulario queda como estaba para ajustar el horario.
    if (e instanceof ErrorDeApi && e.codigo === 'SUPERPOSICION_HORARIA')
      conflictos.value = (e.detalles as { conflictos: ConflictoHorario[] }).conflictos;
    else if (e instanceof ErrorDeApi && Object.keys(e.erroresPorCampo).length > 0)
      errores.value = e.erroresPorCampo;
    else error.value = mensajeDeError(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <section>
    <h2>{{ originalId ? 'Proponer alternativa' : 'Proponer actividad' }}</h2>
    <div v-if="original" class="original">
      <p>
        Alternativa de <strong>{{ original.actividad.titulo }}</strong
        >,
        {{ formatearHorario(original.actividad) }}
      </p>
      <p>Si se confirma una de las opciones, las demás pendientes quedan denegadas.</p>
    </div>
    <form
      class="formulario formulario--con-mapa"
      novalidate
      @submit.prevent="enviar"
      @focusout="alSalir"
    >
      <CampoFormulario id="actividad-titulo" etiqueta="Título" :error="errores['titulo']">
        <input
          id="actividad-titulo"
          v-model="datos.titulo"
          :maxlength="LARGOS_MAXIMOS.titulo"
          name="titulo"
          placeholder="Kayak en el lago"
          v-bind="aria('titulo', 'actividad-titulo')"
        />
      </CampoFormulario>
      <CampoFormulario
        id="actividad-descripcion"
        etiqueta="Descripción"
        :error="errores['descripcion']"
      >
        <textarea
          id="actividad-descripcion"
          v-model="datos.descripcion"
          :maxlength="LARGOS_MAXIMOS.descripcion"
          name="descripcion"
          rows="3"
          v-bind="aria('descripcion', 'actividad-descripcion')"
        ></textarea>
      </CampoFormulario>
      <CampoFechaHora
        v-model:fecha="datos.fecha"
        v-model:hora="datos.horaInicio"
        :desde="actual.fechaInicio"
        :hasta="actual.fechaFin"
        :errores="{ fecha: errores['fecha'], horaInicio: errores['horaInicio'] }"
      />
      <CampoFormulario
        id="actividad-duracion"
        :etiqueta="`Duración en minutos${duracion ? ` (${duracion})` : ''}`"
        :error="errores['duracionMin']"
      >
        <input
          id="actividad-duracion"
          v-bind="aria('duracionMin', 'actividad-duracion')"
          v-model="datos.duracionMin"
          name="duracionMin"
          type="number"
          min="1"
          max="1440"
          step="15"
        />
      </CampoFormulario>
      <CampoUbicacion
        v-model="ubicacion"
        obligatorio-en-mapa
        :error="errores['ubicacion'] ?? errores['latitud'] ?? errores['longitud']"
      />
      <CampoFormulario
        id="actividad-precio"
        :etiqueta="`Precio total estimado en ${actual.moneda.codigo} (opcional)`"
        :error="errores['precio']"
      >
        <input
          id="actividad-precio"
          v-bind="aria('precio', 'actividad-precio')"
          v-model="datos.precio"
          name="precio"
          inputmode="decimal"
          placeholder="30000"
        />
      </CampoFormulario>
      <AvisoSuperposicion v-if="conflictos.length" :conflictos="conflictos" />
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <div class="acciones">
        <RouterLink class="boton" :to="`/viajes/${actual.id}/actividades`">Cancelar</RouterLink>
        <button type="submit" class="boton boton--principal" :disabled="enviando">Proponer</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.original {
  background: var(--color-superficie);
  border-radius: var(--radio);
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
}
.original p {
  margin: 0.25rem 0;
}
</style>
