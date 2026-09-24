<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import CampoFormulario from '../componentes/base/CampoFormulario.vue';
import AvisoExcedeDeuda from '../componentes/gastos/AvisoExcedeDeuda.vue';
import { ErrorDeApi, mensajeDeError } from '../clientes/http';
import { useGastosStore } from '../stores/gastos';
import { useViajeStore } from '../stores/viaje';
import { aUnidadMinima, formatearMonto, nombreVisible } from '../utiles/formato';

const viaje = useViajeStore();
const gastos = useGastosStore();
const route = useRoute();
const router = useRouter();
const actual = viaje.actual!;
const acreedorId = String(route.params['acreedorId']);

const texto = ref('');
const error = ref('');
const errorMonto = ref('');
const enviando = ref(false);
const cargado = ref(false);

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
  if (monto.value === null || monto.value <= 0) {
    errorMonto.value = 'Ingresá un monto mayor que cero, por ejemplo 1500 o 1.500,50';
    return;
  }
  if (excede.value || !deuda.value) return;
  enviando.value = true;
  try {
    // Se toma antes de pagar: si el pago salda la deuda, deja de estar en la lista.
    const nombre = nombreVisible(deuda.value.contraparte);
    const { saldo } = await gastos.pagar({ acreedorId, monto: monto.value });
    gastos.mensaje =
      saldo === 0
        ? `Saldaste tu deuda con ${nombre}.`
        : `Registraste el pago. Todavía le debés ${formatearMonto(saldo, actual.moneda)} a ${nombre}.`;
    await router.push(volver);
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
    <p v-if="!cargado">Cargando…</p>
    <template v-else-if="deuda">
      <p class="saldo">
        Le debés <strong>{{ formatearMonto(deuda.monto, actual.moneda) }}</strong> a
        {{ nombreVisible(deuda.contraparte) }}.
      </p>
      <form novalidate @submit.prevent="pagar">
        <CampoFormulario
          id="pago-monto"
          :etiqueta="`Monto en ${actual.moneda.codigo}`"
          :error="errorMonto"
        >
          <div class="campo-monto">
            <input id="pago-monto" v-model="texto" inputmode="decimal" placeholder="1500" />
            <button type="button" class="boton" @click="pagarTodo">Pagar el total</button>
          </div>
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
.campo-monto {
  display: flex;
  gap: 0.5rem;
}
.campo-monto input {
  flex: 1;
}
.nota {
  color: #57606a;
  font-size: 0.9rem;
}
</style>
