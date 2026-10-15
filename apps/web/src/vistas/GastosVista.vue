<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { GastoVista, PagoDeActividad } from '@viajes/compartido';
import AvisoMensaje from '../componentes/base/AvisoMensaje.vue';
import EstadoVacio from '../componentes/base/EstadoVacio.vue';
import IconoLinea from '../componentes/base/IconoLinea.vue';
import SiluetaCarga from '../componentes/base/SiluetaCarga.vue';
import FilaPago from '../componentes/gastos/FilaPago.vue';
import TarjetaGasto from '../componentes/gastos/TarjetaGasto.vue';
import { mensajeDeError } from '../clientes/http';
import { useGastosStore } from '../stores/gastos';
import { useSesionStore } from '../stores/sesion';
import { useViajeStore } from '../stores/viaje';
import { etiquetaDelDia, formatearMonto } from '../utiles/formato';

const viaje = useViajeStore();
const gastos = useGastosStore();
const sesion = useSesionStore();
const error = ref('');
/** Hasta la primera carga no se muestra la lista vacía. */
const cargado = ref(false);
const ruta = (seccion: string) => `/viajes/${viaje.actual!.id}/${seccion}`;
const monto = (n: number) => formatearMonto(n, viaje.actual!.moneda);

/** Como el saldo de una billetera: lo que te deben menos lo que debés. */
const balance = computed(() => gastos.totalMeDeben - gastos.totalDebo);

type Movimiento =
  | { tipo: 'gasto'; id: string; en: string; gasto: GastoVista }
  | { tipo: 'pago'; id: string; en: string; pago: PagoDeActividad };

/**
 * Gastos del grupo y pagos propios como actividad de una billetera: agrupados por día, del más
 * reciente al más viejo.
 */
const porDia = computed(() => {
  const movimientos: Movimiento[] = [
    ...gastos.gastos.map((g) => ({ tipo: 'gasto' as const, id: g.id, en: g.creadoEn, gasto: g })),
    ...gastos.pagos.map((p) => ({ tipo: 'pago' as const, id: p.id, en: p.fecha, pago: p })),
  ].sort((a, b) => b.en.localeCompare(a.en));
  const grupos: { dia: string; movimientos: Movimiento[] }[] = [];
  for (const m of movimientos) {
    const dia = etiquetaDelDia(m.en);
    const ultimo = grupos.at(-1);
    if (ultimo?.dia === dia) ultimo.movimientos.push(m);
    else grupos.push({ dia, movimientos: [m] });
  }
  return grupos;
});

onMounted(() =>
  Promise.all([gastos.cargarGastos(), gastos.cargarDeudas(), gastos.cargarPagos()])
    .catch((e) => (error.value = mensajeDeError(e)))
    .finally(() => (cargado.value = true)),
);
</script>

<template>
  <section>
    <h2 class="solo-lectores">Gastos</h2>
    <SiluetaCarga v-if="!cargado" />
    <AvisoMensaje v-else-if="error" tipo="error">{{ error }}</AvisoMensaje>
    <template v-else>
      <div class="billetera panel">
        <p class="billetera__rotulo">
          {{ balance > 0 ? 'Te deben' : balance < 0 ? 'Debés' : 'Estás al día' }}
        </p>
        <p
          class="billetera__monto monto"
          :class="{ 'billetera__monto--debo': balance < 0, 'billetera__monto--cero': !balance }"
        >
          {{ monto(Math.abs(balance)) }}
        </p>
        <p class="billetera__detalle">
          Debés {{ monto(gastos.totalDebo) }} · Te deben {{ monto(gastos.totalMeDeben) }}
        </p>
      </div>
      <nav class="accesos" aria-label="Accesos rápidos">
        <RouterLink :to="ruta('gastos/nuevo')" class="acceso acceso--principal">
          <span class="acceso__icono"><IconoLinea nombre="mas" :tamano="22" /></span>
          Anotar gasto
        </RouterLink>
        <RouterLink :to="ruta('saldos')" class="acceso">
          <span class="acceso__icono"><IconoLinea nombre="pagar" :tamano="22" /></span>
          Pagar
        </RouterLink>
        <RouterLink :to="`${ruta('saldos')}?ver=meDeben`" class="acceso">
          <span class="acceso__icono"><IconoLinea nombre="personas" :tamano="22" /></span>
          Me deben
        </RouterLink>
      </nav>

      <h3 class="actividad__titulo">Actividad</h3>
      <EstadoVacio
        v-if="!porDia.length"
        icono="🧾"
        titulo="Todavía no hay gastos anotados."
        descripcion="Anotá lo que pagaste para el grupo y la app calcula quién le debe a quién."
      />
      <section v-for="g in porDia" :key="g.dia" class="dia" :aria-label="g.dia">
        <h4 class="dia__titulo">{{ g.dia }}</h4>
        <div class="panel lista">
          <template v-for="m in g.movimientos" :key="m.id">
            <TarjetaGasto
              v-if="m.tipo === 'gasto'"
              :gasto="m.gasto"
              :moneda="viaje.actual!.moneda"
              :mi-id="sesion.usuario?.id ?? ''"
            />
            <FilaPago
              v-else
              :pago="m.pago"
              :moneda="viaje.actual!.moneda"
              :mi-id="sesion.usuario?.id ?? ''"
            />
          </template>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
/* La tarjeta de billetera: el balance neto bien grande, como en una app de pagos. */
.billetera {
  text-align: center;
  padding: var(--esp-5) var(--esp-4);
}
.billetera p {
  margin: 0;
}
.billetera__rotulo {
  color: var(--color-texto-secundario);
  font-weight: 600;
}
.billetera .billetera__monto {
  font-family: var(--fuente-titulos);
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--color-exito);
  margin: var(--esp-1) 0;
}
.billetera .billetera__monto--debo {
  color: var(--color-error);
}
.billetera .billetera__monto--cero {
  color: var(--color-texto);
}
.billetera__detalle {
  font-size: 0.875rem;
  color: var(--color-texto-secundario);
}
.accesos {
  display: flex;
  justify-content: center;
  gap: var(--esp-5);
  margin: var(--esp-4) 0 var(--esp-5);
}
.acceso {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--esp-1);
  min-width: 4.5rem;
  color: var(--color-texto);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
}
.acceso__icono {
  width: 3.25rem;
  height: 3.25rem;
  display: grid;
  place-content: center;
  border-radius: 50%;
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  color: var(--color-acento);
}
.acceso:hover .acceso__icono {
  border-color: var(--color-acento);
}
.acceso--principal .acceso__icono {
  background: var(--color-acento);
  border-color: var(--color-acento);
  color: var(--color-sobre-acento);
}
.actividad__titulo {
  margin: 0 0 var(--esp-2);
}
.dia {
  margin-bottom: var(--esp-4);
}
.dia__titulo {
  margin: 0 0 var(--esp-2);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-texto-secundario);
}
.lista {
  padding: 0;
  overflow: hidden;
}
/* Una línea entre movimientos, sean gastos o pagos. */
.lista > * + * {
  border-top: 1px solid var(--color-borde);
}
</style>
