<script setup lang="ts">
import SiluetaCarga from '../../componentes/base/SiluetaCarga.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AvisoMensaje from '../../componentes/base/AvisoMensaje.vue';
import CampoFormulario from '../../componentes/base/CampoFormulario.vue';
import IconoLinea from '../../componentes/base/IconoLinea.vue';
import AvisoExcedeDeuda from '../../componentes/gastos/AvisoExcedeDeuda.vue';
import { ErrorDeApi, mensajeDeError } from '../../clientes/http';
import { useCelebracion } from '../../composables/useCelebracion';
import { useGastosStore } from '../../stores/gastos';
import { useViajeStore } from '../../stores/viajes';
import {
  aUnidadMinima,
  formatearDia,
  formatearHora,
  formatearMonto,
  nombreVisible,
  simboloMoneda,
} from '../../utiles/formato';
import { MONTO_INVALIDO } from '../../utiles/formularios';
import { uuidAlAzar } from '../../utiles/uuid';

const viaje = useViajeStore();
const gastos = useGastosStore();
const route = useRoute();
const actual = viaje.actual!;
const { celebrar } = useCelebracion();
const acreedorId = String(route.params['acreedorId']);

const texto = ref('');
const error = ref('');
const errorMonto = ref('');
const enviando = ref(false);
const cargado = ref(false);
/** Después de pagar, la vista muestra el comprobante en lugar del formulario. */
interface Comprobante {
  monto: number;
  nombre: string;
  saldo: number;
  fecha: string;
}
const comprobante = ref<Comprobante | null>(null);
/** RN-P7: id del intento; si la respuesta se pierde y se vuelve a pagar, no se registra dos veces. */
const intento = uuidAlAzar();

// RN-P1 y RN-P2: se paga desde la lista de saldos propios, mostrando lo que se debe.
const deuda = computed(() => gastos.debo.find((d) => d.contraparte.id === acreedorId));
const monto = computed(() =>
  texto.value.trim() === '' ? null : aUnidadMinima(texto.value, actual.moneda.decimales),
);
const excede = computed(
  () => !!deuda.value && monto.value !== null && monto.value > deuda.value.monto,
);
const volver = `/viajes/${actual.id}/saldos`;

onMounted(async () => {
  try {
    await gastos.cargarDeudas();
  } catch (e) {
    error.value = mensajeDeError(e);
  } finally {
    cargado.value = true;
  }
});

function pagarTodo() {
  const { decimales } = actual.moneda;
  if (deuda.value)
    texto.value = (deuda.value.monto / 10 ** decimales).toFixed(decimales).replace('.', ',');
}

async function pagar() {
  error.value = '';
  errorMonto.value = '';
  // El mismo texto que el formulario de gastos: mal escrito o en cero son problemas distintos.
  if (monto.value === null) {
    errorMonto.value = MONTO_INVALIDO;
    return;
  }
  if (monto.value <= 0) {
    errorMonto.value = 'El monto tiene que ser mayor que cero';
    return;
  }
  if (excede.value || !deuda.value) return;
  enviando.value = true;
  try {
    // Se toma antes de pagar: si el pago salda la deuda, deja de estar en la lista.
    const nombre = nombreVisible(deuda.value.contraparte);
    const pagado = monto.value;
    const { saldo } = await gastos.pagar({ id: intento, acreedorId, monto: pagado });
    comprobante.value = { monto: pagado, nombre, saldo, fecha: new Date().toISOString() };
    if (saldo === 0) celebrar(`¡Cuentas saldadas con ${nombre}!`);
    // La deuda pendiente del viaje cambió: el Resumen la usa para el hito de cuentas.
    void viaje.refrescar().catch(() => {});
  } catch (e) {
    // RN-P4: si otro pago cambió el saldo mientras tanto, se vuelve a leer y se avisa.
    if (e instanceof ErrorDeApi && e.codigo === 'PAGO_EXCEDE_DEUDA') await gastos.cargarDeudas();
    else error.value = mensajeDeError(e);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <section>
    <h2>Registrar pago</h2>
    <SiluetaCarga v-if="!cargado" :cantidad="1" />
    <!-- Comprobante, como en una app de pagos: qué se pagó, a quién, cuándo y cuánto queda. -->
    <div v-else-if="comprobante" class="comprobante panel" role="status">
      <span class="comprobante__tilde"><IconoLinea nombre="check" :tamano="32" /></span>
      <h3>{{ comprobante.saldo === 0 ? '¡Deuda saldada!' : 'Pago registrado' }}</h3>
      <p class="comprobante__monto monto">
        {{ formatearMonto(comprobante.monto, actual.moneda) }}
      </p>
      <dl class="comprobante__datos">
        <div>
          <dt>Para</dt>
          <dd>{{ comprobante.nombre }}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{{ formatearDia(comprobante.fecha) }}, {{ formatearHora(comprobante.fecha) }}</dd>
        </div>
        <div>
          <dt>Te queda por pagarle</dt>
          <dd class="monto">
            {{
              comprobante.saldo === 0 ? 'Nada' : formatearMonto(comprobante.saldo, actual.moneda)
            }}
          </dd>
        </div>
      </dl>
      <RouterLink class="boton boton--principal" :to="volver">Listo</RouterLink>
    </div>
    <template v-else-if="deuda">
      <p class="saldo">
        Le debés <strong>{{ formatearMonto(deuda.monto, actual.moneda) }}</strong> a
        {{ nombreVisible(deuda.contraparte) }}.
      </p>
      <form class="formulario" novalidate @submit.prevent="pagar">
        <CampoFormulario
          id="pago-monto"
          :etiqueta="`Monto en ${actual.moneda.codigo}`"
          :error="errorMonto"
        >
          <div class="monto-grande">
            <span class="monto-grande__simbolo" aria-hidden="true">{{
              simboloMoneda(actual.moneda)
            }}</span>
            <input
              id="pago-monto"
              v-model="texto"
              inputmode="decimal"
              placeholder="0"
              :aria-invalid="errorMonto ? 'true' : undefined"
            />
          </div>
          <button type="button" class="boton boton--chico pagar-todo" @click="pagarTodo">
            Pagar el total
          </button>
        </CampoFormulario>
        <AvisoExcedeDeuda v-if="excede" :saldo="deuda.monto" :moneda="actual.moneda" />
        <p class="nota">El pago se registra enseguida y no se puede deshacer.</p>
        <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
        <div class="acciones">
          <RouterLink class="boton" :to="volver">Cancelar</RouterLink>
          <button type="submit" class="boton boton--principal" :disabled="enviando || excede">
            Pagar
          </button>
        </div>
      </form>
    </template>
    <template v-else>
      <AvisoMensaje v-if="error" tipo="error">{{ error }}</AvisoMensaje>
      <p v-else>No tenés una deuda pendiente con esa persona.</p>
      <RouterLink :to="volver">Volver a los saldos</RouterLink>
    </template>
  </section>
</template>

<style scoped>
/* El pago es un formulario corto: en escritorio no se estira a todo el ancho. */
@media (min-width: 64rem) {
  section {
    max-width: 34rem;
  }
}
.pagar-todo {
  align-self: center;
}
.nota {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
}
.comprobante {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--esp-2);
  max-width: 26rem;
  margin: 0 auto;
  padding: var(--esp-5) var(--esp-4);
  text-align: center;
}
.comprobante h3 {
  margin: 0;
}
.comprobante__tilde {
  width: 4rem;
  height: 4rem;
  display: grid;
  place-content: center;
  border-radius: 50%;
  background: var(--color-exito-suave);
  color: var(--color-exito);
}
.comprobante__monto {
  margin: 0;
  font-family: var(--fuente-titulos);
  font-size: 2.25rem;
  font-weight: 800;
}
.comprobante__datos {
  width: 100%;
  margin: var(--esp-2) 0 var(--esp-3);
  border-top: 1px solid var(--color-borde);
}
.comprobante__datos div {
  display: flex;
  justify-content: space-between;
  gap: var(--esp-3);
  padding: var(--esp-2) 0;
  border-bottom: 1px solid var(--color-borde);
}
.comprobante__datos dt {
  color: var(--color-texto-secundario);
}
.comprobante__datos dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}
.comprobante .boton {
  align-self: stretch;
}
</style>
