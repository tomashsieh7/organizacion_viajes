<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  LARGOS_MAXIMOS,
  esquemaGastoNuevo,
  type DatosGastoNuevo,
  type ModoDivision,
} from '@viajes/compartido';
import AvisoMensaje from '../../componentes/base/AvisoMensaje.vue';
import CampoFormulario from '../../componentes/base/CampoFormulario.vue';
import MontoGrande from '../../componentes/gastos/MontoGrande.vue';
import SelectorDeudores from '../../componentes/gastos/SelectorDeudores.vue';
import SelectorModoDivision from '../../componentes/gastos/SelectorModoDivision.vue';
import SelectorPagador from '../../componentes/gastos/SelectorPagador.vue';
import TablaPartes from '../../componentes/gastos/TablaPartes.vue';
import { ErrorDeApi, mensajeDeError } from '../../clientes/http';
import { useGastosStore } from '../../stores/gastos';
import { useSesionStore } from '../../stores/sesion';
import { useViajeStore } from '../../stores/viajes';
import { aUnidadMinima, formatearMonto, simboloMoneda } from '../../utiles/formato';
import { uuidAlAzar } from '../../utiles/uuid';
import { useValidacion } from '../../composables/useValidacion';
import { MONTO_INVALIDO, problemasSegun } from '../../utiles/formularios';

const viaje = useViajeStore();
const gastos = useGastosStore();
const sesion = useSesionStore();
const router = useRouter();
const actual = viaje.actual!;
const miId = sesion.usuario?.id ?? '';

const datos = reactive({
  titulo: '',
  categoriaId: '',
  monto: '',
  // P12: por defecto paga quien anota.
  pagadoPorId: miId,
  modo: 'IGUALES' as ModoDivision,
});
// P13: la lista arranca sin nadie elegido.
const deudores = ref<string[]>([]);
const montos = ref<Record<string, string>>({});
const error = ref('');
const enviando = ref(false);
/** RN-G7: id del intento; si la respuesta se pierde y se vuelve a guardar, no se anota dos veces. */
const intento = uuidAlAzar();

const total = computed(() =>
  datos.monto.trim() === '' ? null : aUnidadMinima(datos.monto, actual.moneda.decimales),
);
const elegidos = computed(() =>
  viaje.participantes.filter((p) => deudores.value.includes(p.usuarioId)),
);

onMounted(async () => {
  try {
    await Promise.all([gastos.cargarCategorias(), viaje.cargarParticipantes()]);
  } catch (e) {
    error.value = mensajeDeError(e);
  }
});

// Al cambiar los elegidos se descartan los montos de quienes ya no están.
watch(deudores, (ids) => {
  montos.value = Object.fromEntries(
    Object.entries(montos.value).filter(([id]) => ids.includes(id)),
  );
});

/** Arma el cuerpo para la API y devuelve sus problemas, con el mismo esquema que valida la API. */
function armarCuerpo(): { cuerpo: DatosGastoNuevo; problemas: Record<string, string> } {
  const cuerpo: DatosGastoNuevo = {
    id: intento,
    titulo: datos.titulo,
    categoriaId: datos.categoriaId,
    monto: total.value ?? Number.NaN,
    pagadoPorId: datos.pagadoPorId,
    deudores: deudores.value,
    modoDivision: datos.modo,
  };
  let partesInvalidas = false;
  if (datos.modo === 'ARBITRARIA') {
    cuerpo.partes = deudores.value.map((usuarioId) => {
      const monto = aUnidadMinima(montos.value[usuarioId] ?? '', actual.moneda.decimales);
      partesInvalidas ||= monto === null;
      return { usuarioId, monto: monto ?? Number.NaN };
    });
  }
  const problemas = problemasSegun(esquemaGastoNuevo, cuerpo);
  if (total.value === null) problemas['monto'] = MONTO_INVALIDO;
  if (partesInvalidas) problemas['partes'] = 'Completá un monto válido para cada persona';
  return { cuerpo, problemas };
}

const { errores, alSalir, validarTodo, aria } = useValidacion(
  () => armarCuerpo().problemas,
  [datos, deudores, montos],
);

async function enviar() {
  error.value = '';
  if (!validarTodo()) return;
  const { cuerpo } = armarCuerpo();
  enviando.value = true;
  try {
    await gastos.anotar(cuerpo);
    await router.push(`/viajes/${actual.id}/gastos`);
  } catch (e) {
    if (e instanceof ErrorDeApi && e.codigo === 'SUMA_NO_COINCIDE') {
      const { diferencia } = e.detalles as { diferencia: number };
      errores.value = {
        partes: `La suma no coincide con el total: ${diferencia > 0 ? 'faltan' : 'sobran'} ${formatearMonto(Math.abs(diferencia), actual.moneda)}`,
      };
    } else if (e instanceof ErrorDeApi && Object.keys(e.erroresPorCampo).length > 0) {
      errores.value = e.erroresPorCampo;
    } else error.value = mensajeDeError(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <section>
    <h2>Anotar gasto</h2>
    <form class="formulario" novalidate @submit.prevent="enviar" @focusout="alSalir">
      <!-- En escritorio, qué y quién pagó a la izquierda, y entre quiénes se divide a la derecha. -->
      <div class="grilla grilla--doble">
        <div>
          <CampoFormulario id="gasto-titulo" etiqueta="Título" :error="errores['titulo']">
            <input
              id="gasto-titulo"
              v-model="datos.titulo"
              :maxlength="LARGOS_MAXIMOS.titulo"
              name="titulo"
              placeholder="Cena en el centro"
              v-bind="aria('titulo', 'gasto-titulo')"
            />
          </CampoFormulario>
          <!-- El monto, protagonista: en grande, como en una app de pagos. -->
          <CampoFormulario
            id="gasto-monto"
            :etiqueta="`Monto en ${actual.moneda.codigo}`"
            :error="errores['monto']"
          >
            <MontoGrande
              id="gasto-monto"
              v-model="datos.monto"
              :simbolo="simboloMoneda(actual.moneda)"
              name="monto"
              placeholder="0"
              v-bind="aria('monto', 'gasto-monto')"
            />
          </CampoFormulario>
          <CampoFormulario
            id="gasto-categoria"
            etiqueta="Categoría"
            :error="errores['categoriaId']"
          >
            <!-- RN-G1: la categoría la elige quien anota; no se preselecciona ninguna. -->
            <select
              id="gasto-categoria"
              v-model="datos.categoriaId"
              name="categoriaId"
              v-bind="aria('categoriaId', 'gasto-categoria')"
            >
              <option value="" disabled>Elegí una categoría</option>
              <option v-for="c in gastos.categorias" :key="c.id" :value="c.id">
                {{ c.nombre }}
              </option>
            </select>
          </CampoFormulario>
          <SelectorPagador
            v-model="datos.pagadoPorId"
            :participantes="viaje.participantes"
            :mi-id="miId"
          />
        </div>
        <div>
          <SelectorDeudores
            v-model="deudores"
            :participantes="viaje.participantes"
            :error="errores['deudores']"
          />
          <SelectorModoDivision v-model="datos.modo" />
          <TablaPartes
            v-model="montos"
            :modo="datos.modo"
            :total="total"
            :deudores="elegidos"
            :moneda="actual.moneda"
          />
          <p v-if="errores['partes']" class="error-partes" role="alert">{{ errores['partes'] }}</p>
        </div>
      </div>
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <div class="acciones">
        <RouterLink class="boton" :to="`/viajes/${actual.id}/gastos`">Cancelar</RouterLink>
        <button
          type="submit"
          class="boton boton--principal"
          :disabled="enviando || deudores.length === 0"
        >
          Guardar
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.error-partes {
  color: var(--color-error);
}
</style>
