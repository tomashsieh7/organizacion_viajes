<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { esquemaAlojamientoNuevo } from '@viajes/compartido';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import CampoFormulario from '../componentes/base/CampoFormulario.vue';
import CampoUbicacion, { type ValorUbicacion } from '../componentes/mapa/CampoUbicacion.vue';
import { ErrorDeApi, mensajeDeError } from '../clientes/http';
import { usePropuestasStore } from '../stores/propuestas';
import { useViajeStore } from '../stores/viaje';
import { aUnidadMinima } from '../utiles/formato';
import { useValidacion } from '../composables/useValidacion';
import { MONTO_INVALIDO, problemasSegun } from '../utiles/formularios';

const viaje = useViajeStore();
const propuestas = usePropuestasStore();
const router = useRouter();
const actual = viaje.actual!;

const datos = reactive({
  nombre: '',
  descripcion: '',
  fechaDesde: actual.fechaInicio,
  fechaHasta: actual.fechaFin,
  precio: '',
});
const ubicacion = ref<ValorUbicacion>({ ubicacion: '', latitud: null, longitud: null });
const error = ref('');
const enviando = ref(false);

/** Arma el cuerpo para la API y devuelve sus problemas, con el mismo esquema que valida la API. */
function armarCuerpo() {
  const precio =
    datos.precio.trim() === '' ? undefined : aUnidadMinima(datos.precio, actual.moneda.decimales);
  const cuerpo = {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    fechaDesde: datos.fechaDesde,
    fechaHasta: datos.fechaHasta,
    ubicacion: ubicacion.value.ubicacion,
    ...(ubicacion.value.latitud !== null && ubicacion.value.longitud !== null
      ? { latitud: ubicacion.value.latitud, longitud: ubicacion.value.longitud }
      : {}),
    ...(precio === undefined || precio === null ? {} : { precio }),
  };
  const problemas = problemasSegun(esquemaAlojamientoNuevo, cuerpo);
  if (precio === null) problemas['precio'] = MONTO_INVALIDO;
  return { cuerpo, problemas };
}

const { errores, alSalir, validarTodo, aria } = useValidacion(
  () => armarCuerpo().problemas,
  [datos, ubicacion],
);

async function enviar() {
  error.value = '';
  if (!validarTodo()) return;
  const { cuerpo } = armarCuerpo();
  enviando.value = true;
  try {
    await propuestas.proponerAlojamiento(cuerpo);
    await router.push(`/viajes/${actual.id}/alojamientos`);
  } catch (e) {
    if (e instanceof ErrorDeApi && Object.keys(e.erroresPorCampo).length > 0)
      errores.value = e.erroresPorCampo;
    else error.value = mensajeDeError(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <section>
    <h2>Proponer alojamiento</h2>
    <form class="formulario" novalidate @submit.prevent="enviar" @focusout="alSalir">
      <CampoFormulario id="alojamiento-nombre" etiqueta="Nombre" :error="errores['nombre']">
        <input
          id="alojamiento-nombre"
          v-model="datos.nombre"
          name="nombre"
          placeholder="Hostel Patagonia"
          v-bind="aria('nombre', 'alojamiento-nombre')"
        />
      </CampoFormulario>
      <CampoFormulario
        id="alojamiento-descripcion"
        etiqueta="Descripción"
        :error="errores['descripcion']"
      >
        <textarea
          id="alojamiento-descripcion"
          v-model="datos.descripcion"
          name="descripcion"
          rows="3"
          v-bind="aria('descripcion', 'alojamiento-descripcion')"
        ></textarea>
      </CampoFormulario>
      <!-- P11: el selector solo ofrece días del viaje. -->
      <div class="fila">
        <CampoFormulario id="alojamiento-desde" etiqueta="Entrada" :error="errores['fechaDesde']">
          <input
            id="alojamiento-desde"
            v-bind="aria('fechaDesde', 'alojamiento-desde')"
            v-model="datos.fechaDesde"
            name="fechaDesde"
            type="date"
            :min="actual.fechaInicio"
            :max="actual.fechaFin"
          />
        </CampoFormulario>
        <CampoFormulario id="alojamiento-hasta" etiqueta="Salida" :error="errores['fechaHasta']">
          <input
            id="alojamiento-hasta"
            v-bind="aria('fechaHasta', 'alojamiento-hasta')"
            v-model="datos.fechaHasta"
            name="fechaHasta"
            type="date"
            :min="datos.fechaDesde"
            :max="actual.fechaFin"
          />
        </CampoFormulario>
      </div>
      <CampoUbicacion v-model="ubicacion" :error="errores['ubicacion'] ?? errores['latitud']" />
      <CampoFormulario
        id="alojamiento-precio"
        :etiqueta="`Precio total estimado en ${actual.moneda.codigo} (opcional)`"
        :error="errores['precio']"
      >
        <input
          id="alojamiento-precio"
          v-bind="aria('precio', 'alojamiento-precio')"
          v-model="datos.precio"
          name="precio"
          inputmode="decimal"
          placeholder="48000"
        />
      </CampoFormulario>
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <div class="acciones">
        <RouterLink class="boton" :to="`/viajes/${actual.id}/alojamientos`">Cancelar</RouterLink>
        <button type="submit" class="boton boton--principal" :disabled="enviando">Proponer</button>
      </div>
    </form>
  </section>
</template>
