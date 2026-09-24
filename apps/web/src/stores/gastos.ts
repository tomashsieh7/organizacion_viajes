import { defineStore } from 'pinia';
import { computed, inject, ref } from 'vue';
import type {
  CategoriaGasto,
  DatosGastoNuevo,
  DatosPagoNuevo,
  DeudaVista,
  GastoVista,
} from '@viajes/compartido';
import { CLIENTE_GASTOS } from '../clientes/gastos';
import { useViajeStore } from './viaje';

/** Gastos y saldos del viaje abierto (CU20 a CU22). */
export const useGastosStore = defineStore('gastos', () => {
  const cliente = inject(CLIENTE_GASTOS);
  if (!cliente) throw new Error('Falta inyectar ClienteGastos');

  const viaje = useViajeStore();
  const viajeId = () => {
    if (!viaje.actual) throw new Error('No hay un viaje abierto');
    return viaje.actual.id;
  };
  const gastos = ref<GastoVista[]>([]);
  const categorias = ref<CategoriaGasto[]>([]);
  const debo = ref<DeudaVista[]>([]);
  const meDeben = ref<DeudaVista[]>([]);
  /** Confirmación del último pago, que muestra la sección de saldos una sola vez. */
  const mensaje = ref('');
  const totalDebo = computed(() => debo.value.reduce((t, d) => t + d.monto, 0));
  const totalMeDeben = computed(() => meDeben.value.reduce((t, d) => t + d.monto, 0));

  async function cargarGastos() {
    gastos.value = await cliente!.listar(viajeId());
  }

  async function cargarCategorias() {
    if (categorias.value.length === 0) categorias.value = await cliente!.categorias();
  }

  async function cargarDeudas() {
    const id = viajeId();
    [debo.value, meDeben.value] = await Promise.all([
      cliente!.deudas(id, 'deudor'),
      cliente!.deudas(id, 'acreedor'),
    ]);
  }

  /** Después de anotar vuelve a pedir las deudas, porque el gasto las cambia (sección 7.2). */
  async function anotar(datos: DatosGastoNuevo) {
    const gasto = await cliente!.anotar(viajeId(), datos);
    gastos.value = [gasto, ...gastos.value];
    await cargarDeudas();
    return gasto;
  }

  /** CU23: después de pagar vuelve a pedir las deudas, porque el pago las cambia (sección 7.2). */
  async function pagar(datos: DatosPagoNuevo) {
    const respuesta = await cliente!.pagar(viajeId(), datos);
    await cargarDeudas();
    return respuesta;
  }

  return {
    mensaje,
    pagar,
    gastos,
    categorias,
    debo,
    meDeben,
    totalDebo,
    totalMeDeben,
    cargarGastos,
    cargarCategorias,
    cargarDeudas,
    anotar,
  };
});
