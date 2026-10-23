import { defineStore } from 'pinia';
import { computed, inject, ref } from 'vue';
import type {
  DatosViaje,
  DatosViajeNuevo,
  DetalleViaje,
  Moneda,
  Participante,
  Reacomodo,
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
  /** Aviso para mostrar dentro del viaje abierto, por ejemplo al quedar con acceso solo a saldos. */
  const aviso = ref('');
  /**
   * Aviso para la lista de viajes, por ejemplo al salir de uno o cuando el Admin te quita. Es
   * aparte del anterior porque el viaje borra el suyo al cerrarse, justo cuando se abre la lista.
   */
  const avisoLista = ref('');
  const soyAdmin = computed(() => actual.value?.miRol === 'ADMIN');

  async function cargarViajes() {
    viajes.value = await cliente!.listar();
  }

  async function cargarMonedas() {
    if (monedas.value.length === 0) monedas.value = await cliente!.monedas();
  }

  async function crearViaje(datos: DatosViajeNuevo): Promise<DetalleViaje> {
    const viaje = await cliente!.crear(datos);
    // El viaje ya existe: si falla recargar la lista, no se informa como si no se hubiera creado,
    // porque reintentar crearía otro igual. La lista se vuelve a cargar al volver a "Mis grupos".
    await cargarViajes().catch(() => undefined);
    return viaje;
  }

  async function abrir(viajeId: string) {
    if (actual.value?.id !== viajeId) {
      actual.value = null;
      participantes.value = [];
    }
    actual.value = await cliente!.obtener(viajeId);
  }

  /** CU27: el viaje abierto pasa a mostrar los datos nuevos; devuelve cómo se reacomodó. */
  async function modificarDatos(datos: DatosViaje): Promise<Reacomodo> {
    const { viaje, reacomodo } = await cliente!.modificarDatos(actual.value!.id, datos);
    actual.value = viaje;
    const { nombre, destino, fechaInicio, fechaFin } = viaje;
    viajes.value = viajes.value.map((v) =>
      v.id === viaje.id ? { ...v, nombre, destino, fechaInicio, fechaFin } : v,
    );
    return reacomodo;
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

  /** RN-E4: la membresía terminó mientras el viaje estaba abierto. */
  async function cerrarPorBaja(mensaje: string) {
    actual.value = null;
    participantes.value = [];
    avisoLista.value = mensaje;
    await cargarViajes();
  }

  return {
    viajes,
    aviso,
    avisoLista,
    monedas,
    actual,
    participantes,
    soyAdmin,
    cargarViajes,
    cargarMonedas,
    crearViaje,
    abrir,
    modificarDatos,
    cargarParticipantes,
    agregarViajero,
    eliminarParticipante,
    transferirAdministracion,
    salir,
    refrescar,
    cerrarPorBaja,
  };
});
