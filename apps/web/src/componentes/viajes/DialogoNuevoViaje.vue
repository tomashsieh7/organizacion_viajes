<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import {
  LARGOS_MAXIMOS,
  esquemaViajeNuevo,
  unAnioDespues,
  type DatosViajeNuevo,
} from '@viajes/compartido';
import CampoFormulario from '../base/CampoFormulario.vue';
import AvisoMensaje from '../base/AvisoMensaje.vue';
import DialogoModal from '../base/DialogoModal.vue';
import FormularioAgregarViajero from './FormularioAgregarViajero.vue';
import { ErrorDeApi, mensajeDeError } from '../../clientes/http';
import { useViajeStore } from '../../stores/viajes';
import { useValidacion } from '../../composables/useValidacion';
import { problemasSegun } from '../../utiles/formularios';

/**
 * CU01 en tres pasos: dónde, cuándo y con quién. El viaje se crea al terminar el segundo; el
 * tercero suma viajeros al viaje ya creado, así un email que falla no deja el viaje a medias.
 */
const emit = defineEmits<{ cerrar: []; creado: [viajeId: string] }>();
const store = useViajeStore();

type Paso = 1 | 2 | 3;
const TITULOS: Record<Paso, string> = { 1: '¿A dónde van?', 2: '¿Cuándo?', 3: '¿Con quién?' };
/** Con la ", " del medio, ciudad y país nunca superan el largo máximo del destino. */
const LARGO_CIUDAD = 70;
const LARGO_PAIS = LARGOS_MAXIMOS.destino - LARGO_CIUDAD - 2;

/** Los campos que se validan en cada paso; el destino se carga como ciudad y país. */
const CAMPOS: Record<1 | 2, string[]> = {
  1: ['nombre', 'ciudad'],
  2: ['fechaInicio', 'fechaFin', 'monedaCodigo'],
};

const paso = ref<Paso>(1);
const titulo = ref<HTMLElement | null>(null);
const viajeId = ref('');
const datos = reactive({
  nombre: '',
  ciudad: '',
  pais: '',
  fechaInicio: '',
  fechaFin: '',
  monedaCodigo: 'ARS',
});

/** Lo que recibe la API: el destino es "Ciudad, País", o solo la ciudad si no hay país. */
const viajeNuevo = computed<DatosViajeNuevo>(() => ({
  nombre: datos.nombre,
  destino: [datos.ciudad.trim(), datos.pais.trim()].filter(Boolean).join(', '),
  fechaInicio: datos.fechaInicio,
  fechaFin: datos.fechaFin,
  monedaCodigo: datos.monedaCodigo,
}));

/** Los errores del destino se muestran en la ciudad, que es el campo obligatorio. */
const aCampos = (errores: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(errores).map(([c, m]) =>
      c === 'destino' ? ['ciudad', datos.ciudad.trim() ? m : 'Ingresá la ciudad'] : [c, m],
    ),
  );

const { errores, alSalir, validarTodo, aria } = useValidacion(() => {
  if (paso.value === 3) return {};
  const campos = CAMPOS[paso.value];
  return Object.fromEntries(
    Object.entries(aCampos(problemasSegun(esquemaViajeNuevo, viajeNuevo.value))).filter(([c]) =>
      campos.includes(c),
    ),
  );
}, datos);
const error = ref('');
const enviando = ref(false);

onMounted(() => store.cargarMonedas().catch((e) => (error.value = mensajeDeError(e))));

/** Al cambiar de paso, el foco va al título para que el lector de pantalla lo anuncie. */
async function irA(nuevo: Paso) {
  error.value = '';
  paso.value = nuevo;
  await nextTick();
  titulo.value?.focus();
}

async function crear() {
  enviando.value = true;
  try {
    // Si un intento anterior creó el viaje y falló después, se reintenta solo lo que faltó, así
    // no queda un viaje duplicado.
    viajeId.value ||= (await store.crearViaje(viajeNuevo.value)).id;
    // FormularioAgregarViajero trabaja sobre el viaje abierto.
    await store.abrir(viajeId.value);
    await irA(3);
  } catch (e) {
    if (e instanceof ErrorDeApi && Object.keys(e.erroresPorCampo).length > 0) {
      errores.value = aCampos(e.erroresPorCampo);
      if (Object.keys(errores.value).some((c) => CAMPOS[1].includes(c))) await irA(1);
    } else error.value = mensajeDeError(e);
  } finally {
    enviando.value = false;
  }
}

async function siguiente() {
  if (!validarTodo()) return;
  if (paso.value === 1) await irA(2);
  else if (paso.value === 2) await crear();
}

/** Con el viaje ya creado, cerrar el diálogo también lleva al viaje. */
function cerrar() {
  if (viajeId.value) emit('creado', viajeId.value);
  else emit('cerrar');
}
</script>

<template>
  <DialogoModal titulo="Nuevo grupo de viaje" @cerrar="cerrar">
    <div class="pasos" aria-hidden="true">
      <span v-for="n in 3" :key="n" class="pasos__marca" :class="{ hecho: n <= paso }" />
    </div>
    <h3 ref="titulo" tabindex="-1" class="titulo-paso">
      <span class="texto-secundario">Paso {{ paso }} de 3 · </span>{{ TITULOS[paso] }}
    </h3>

    <form v-if="paso !== 3" novalidate @submit.prevent="siguiente" @focusout="alSalir">
      <template v-if="paso === 1">
        <CampoFormulario
          id="viaje-nombre"
          etiqueta="Nombre del grupo"
          ayuda="Así lo van a ver todos en el grupo."
          :error="errores['nombre']"
        >
          <input
            id="viaje-nombre"
            v-bind="aria('nombre', 'viaje-nombre', 'viaje-nombre-ayuda')"
            v-model="datos.nombre"
            :maxlength="LARGOS_MAXIMOS.nombreViaje"
            name="nombre"
            placeholder="Bariloche 2026"
          />
        </CampoFormulario>
        <div class="fila">
          <CampoFormulario id="viaje-ciudad" etiqueta="Ciudad" :error="errores['ciudad']">
            <input
              id="viaje-ciudad"
              v-bind="aria('ciudad', 'viaje-ciudad')"
              v-model="datos.ciudad"
              :maxlength="LARGO_CIUDAD"
              name="ciudad"
              placeholder="Bariloche"
              autocomplete="off"
            />
          </CampoFormulario>
          <CampoFormulario id="viaje-pais" etiqueta="País (opcional)">
            <input
              id="viaje-pais"
              v-model="datos.pais"
              :maxlength="LARGO_PAIS"
              name="pais"
              placeholder="Argentina"
              autocomplete="country-name"
            />
          </CampoFormulario>
        </div>
      </template>

      <template v-else>
        <div class="fila">
          <CampoFormulario id="viaje-inicio" etiqueta="Desde" :error="errores['fechaInicio']">
            <input
              id="viaje-inicio"
              v-bind="aria('fechaInicio', 'viaje-inicio', 'viaje-fechas-ayuda')"
              v-model="datos.fechaInicio"
              name="fechaInicio"
              type="date"
            />
          </CampoFormulario>
          <CampoFormulario id="viaje-fin" etiqueta="Hasta" :error="errores['fechaFin']">
            <input
              id="viaje-fin"
              v-bind="aria('fechaFin', 'viaje-fin', 'viaje-fechas-ayuda')"
              v-model="datos.fechaFin"
              name="fechaFin"
              type="date"
              :min="datos.fechaInicio"
              :max="datos.fechaInicio ? unAnioDespues(datos.fechaInicio) : undefined"
            />
          </CampoFormulario>
        </div>
        <small id="viaje-fechas-ayuda" class="ayuda ayuda--bloque"
          >Incluí el día de llegada y el de vuelta.</small
        >
        <CampoFormulario
          id="viaje-moneda"
          etiqueta="Moneda de los gastos"
          ayuda="Todos los gastos del grupo se anotan en esta moneda."
          :error="errores['monedaCodigo']"
        >
          <select
            id="viaje-moneda"
            v-bind="aria('monedaCodigo', 'viaje-moneda', 'viaje-moneda-ayuda')"
            v-model="datos.monedaCodigo"
            name="monedaCodigo"
          >
            <option v-for="m in store.monedas" :key="m.codigo" :value="m.codigo">
              {{ m.nombre }} ({{ m.codigo }})
            </option>
          </select>
        </CampoFormulario>
      </template>

      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <div class="acciones">
        <button v-if="paso === 1" type="button" class="boton" @click="emit('cerrar')">
          Cancelar
        </button>
        <!-- Con el viaje ya creado, volver a editar el paso 1 no cambiaría nada. -->
        <button v-else-if="!viajeId" type="button" class="boton" @click="irA(1)">Atrás</button>
        <button type="submit" class="boton boton--principal" :disabled="enviando">
          {{ paso === 1 ? 'Siguiente' : 'Crear viaje' }}
        </button>
      </div>
    </form>

    <template v-else>
      <AvisoMensaje tipo="exito">¡Listo! Ya creaste «{{ datos.nombre.trim() }}».</AvisoMensaje>
      <p class="ayuda">
        Sumá a tus compañeros para planificar juntos. Tienen que tener cuenta en la app; si todavía
        no la tienen, podés agregarlos después desde Participantes.
      </p>
      <FormularioAgregarViajero />
      <div class="acciones">
        <button type="button" class="boton boton--principal" @click="cerrar">Ir al viaje</button>
      </div>
    </template>
  </DialogoModal>
</template>

<style scoped>
.pasos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--esp-1);
  margin-bottom: var(--esp-3);
}
.pasos__marca {
  height: 4px;
  border-radius: 999px;
  background: var(--color-borde);
}
.pasos__marca.hecho {
  background: var(--color-acento);
}
.titulo-paso {
  margin: 0 0 var(--esp-4);
  font-size: 1.15rem;
}
.titulo-paso:focus {
  outline: none;
}
.ayuda--bloque {
  display: block;
  margin: calc(-1 * var(--esp-2)) 0 var(--esp-4);
}
</style>
