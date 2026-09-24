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
const errores = ref<Record<string, string>>({});
const error = ref('');
const enviando = ref(false);

async function enviar() {
  error.value = '';
  errores.value = {};
  const precio =
    datos.precio.trim() === '' ? undefined : aUnidadMinima(datos.precio, actual.moneda.decimales);
  if (precio === null) {
    errores.value = { precio: 'Ingresá un monto válido, por ejemplo 48000 o 48.000,50' };
    return;
  }
  const cuerpo = {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    fechaDesde: datos.fechaDesde,
    fechaHasta: datos.fechaHasta,
    ubicacion: ubicacion.value.ubicacion,
    ...(ubicacion.value.latitud !== null && ubicacion.value.longitud !== null
      ? { latitud: ubicacion.value.latitud, longitud: ubicacion.value.longitud }
      : {}),
    ...(precio === undefined ? {} : { precio }),
  };
  const resultado = esquemaAlojamientoNuevo.safeParse(cuerpo);
  if (!resultado.success) {
    errores.value = Object.fromEntries(
      resultado.error.issues.map((i) => [String(i.path[0]), i.message]),
    );
    return;
  }
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
    <form novalidate @submit.prevent="enviar">
      <CampoFormulario id="alojamiento-nombre" etiqueta="Nombre" :error="errores['nombre']">
        <input id="alojamiento-nombre" v-model="datos.nombre" placeholder="Hostel Patagonia" />
      </CampoFormulario>
      <CampoFormulario
        id="alojamiento-descripcion"
        etiqueta="Descripción"
        :error="errores['descripcion']"
      >
        <textarea id="alojamiento-descripcion" v-model="datos.descripcion" rows="3"></textarea>
      </CampoFormulario>
      <!-- P11: el selector solo ofrece días del viaje. -->
      <div class="fila">
        <CampoFormulario id="alojamiento-desde" etiqueta="Entrada" :error="errores['fechaDesde']">
          <input
            id="alojamiento-desde"
            v-model="datos.fechaDesde"
            type="date"
            :min="actual.fechaInicio"
            :max="actual.fechaFin"
          />
        </CampoFormulario>
        <CampoFormulario id="alojamiento-hasta" etiqueta="Salida" :error="errores['fechaHasta']">
          <input
            id="alojamiento-hasta"
            v-model="datos.fechaHasta"
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
          v-model="datos.precio"
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

<style scoped>
textarea {
  font: inherit;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio);
}
</style>
