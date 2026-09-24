import { defineStore } from 'pinia';
import { computed, inject, ref } from 'vue';
import type {
  DatosViajeNuevo,
  DetalleViaje,
  Moneda,
  Participante,
  ResumenViaje,
} from '@viajes/compartido';
import { CLIENTE_VIAJES } from '../clientes/viajes';

/** Viajes del usuario, viaje abierto y sus participantes. */
export const useViajeStore = defineStore('viaje', () => {
  const cliente = inject(CLIENTE_VIAJES);
  if (!cliente) throw new Error('Falta inyectar ClienteViajes');

  const viajes = ref<ResumenViaje[]>([]);
  const monedas = ref<Moneda[]>([]);
  const actual = ref<DetalleViaje | null>(null);
  const participantes = ref<Participante[]>([]);
  const soyAdmin = computed(() => actual.value?.miRol === 'ADMIN');

  async function cargarViajes() {
    viajes.value = await cliente!.listar();
  }

  async function cargarMonedas() {
    if (monedas.value.length === 0) monedas.value = await cliente!.monedas();
  }

  async function crearViaje(datos: DatosViajeNuevo): Promise<DetalleViaje> {
    const viaje = await cliente!.crear(datos);
    await cargarViajes();
    return viaje;
  }

  async function abrir(viajeId: string) {
    if (actual.value?.id !== viajeId) {
      actual.value = null;
      participantes.value = [];
    }
    actual.value = await cliente!.obtener(viajeId);
  }

  async function cargarParticipantes() {
    if (actual.value) participantes.value = await cliente!.participantes(actual.value.id);
  }

  /** Vuelve a leer el viaje y sus participantes después de un cambio. */
  async function refrescar() {
    if (!actual.value) return;
    await abrir(actual.value.id);
    await cargarParticipantes();
  }

  async function agregarViajero(email: string) {
    await cliente!.agregarViajero(actual.value!.id, email);
    await refrescar();
  }

  async function eliminarParticipante(usuarioId: string) {
    const r = await cliente!.eliminarParticipante(actual.value!.id, usuarioId);
    await refrescar();
    return r;
  }

  async function transferirAdministracion(nuevoAdminId: string) {
    await cliente!.transferirAdministracion(actual.value!.id, nuevoAdminId);
    await refrescar();
  }

  async function salir(nuevoAdminId?: string) {
    await cliente!.salir(actual.value!.id, nuevoAdminId);
    actual.value = null;
    participantes.value = [];
    await cargarViajes();
  }

  return {
    viajes,
    monedas,
    actual,
    participantes,
    soyAdmin,
    cargarViajes,
    cargarMonedas,
    crearViaje,
    abrir,
    cargarParticipantes,
    agregarViajero,
    eliminarParticipante,
    transferirAdministracion,
    salir,
  };
});
