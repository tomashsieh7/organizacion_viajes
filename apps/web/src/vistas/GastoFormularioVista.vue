<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { esquemaGastoNuevo, type DatosGastoNuevo, type ModoDivision } from '@viajes/compartido';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import CampoFormulario from '../componentes/base/CampoFormulario.vue';
import SelectorDeudores from '../componentes/gastos/SelectorDeudores.vue';
import SelectorModoDivision from '../componentes/gastos/SelectorModoDivision.vue';
import SelectorPagador from '../componentes/gastos/SelectorPagador.vue';
import TablaPartes from '../componentes/gastos/TablaPartes.vue';
import { ErrorDeApi, mensajeDeError } from '../clientes/http';
import { useGastosStore } from '../stores/gastos';
import { useSesionStore } from '../stores/sesion';
import { useViajeStore } from '../stores/viaje';
import { aUnidadMinima, formatearMonto } from '../utiles/formato';

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
const errores = ref<Record<string, string>>({});
const error = ref('');
const enviando = ref(false);

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

function armarCuerpo(): DatosGastoNuevo | null {
  if (total.value === null) {
    errores.value = { monto: 'Ingresá un monto válido, por ejemplo 48000 o 48.000,50' };
    return null;
  }
  const cuerpo: DatosGastoNuevo = {
    titulo: datos.titulo,
    categoriaId: datos.categoriaId,
    monto: total.value,
    pagadoPorId: datos.pagadoPorId,
    deudores: deudores.value,
    modoDivision: datos.modo,
  };
  if (datos.modo === 'ARBITRARIA') {
    const partes = deudores.value.map((usuarioId) => ({
      usuarioId,
      monto: aUnidadMinima(montos.value[usuarioId] ?? '', actual.moneda.decimales),
    }));
    if (partes.some((p) => p.monto === null)) {
      errores.value = { partes: 'Completá un monto válido para cada persona' };
      return null;
    }
    cuerpo.partes = partes as { usuarioId: string; monto: number }[];
  }
  return cuerpo;
}

async function enviar() {
  error.value = '';
  errores.value = {};
  const cuerpo = armarCuerpo();
  if (!cuerpo) return;
  const resultado = esquemaGastoNuevo.safeParse(cuerpo);
  if (!resultado.success) {
    errores.value = Object.fromEntries(
      resultado.error.issues.map((i) => [String(i.path[0]), i.message]),
    );
    return;
  }
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
    <form novalidate @submit.prevent="enviar">
      <CampoFormulario id="gasto-titulo" etiqueta="Título" :error="errores['titulo']">
        <input id="gasto-titulo" v-model="datos.titulo" placeholder="Cena en el centro" />
      </CampoFormulario>
      <div class="fila">
        <CampoFormulario id="gasto-categoria" etiqueta="Categoría" :error="errores['categoriaId']">
          <!-- RN-G1: la categoría la elige quien anota; no se preselecciona ninguna. -->
          <select id="gasto-categoria" v-model="datos.categoriaId">
            <option value="" disabled>Elegí una categoría</option>
            <option v-for="c in gastos.categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </CampoFormulario>
        <CampoFormulario
          id="gasto-monto"
          :etiqueta="`Monto en ${actual.moneda.codigo}`"
          :error="errores['monto']"
        >
          <input id="gasto-monto" v-model="datos.monto" inputmode="decimal" placeholder="48000" />
        </CampoFormulario>
      </div>
      <SelectorPagador
        v-model="datos.pagadoPorId"
        :participantes="viaje.participantes"
        :mi-id="miId"
      />
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
