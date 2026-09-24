import { defineStore } from 'pinia';
import { inject, ref } from 'vue';
import type {
  AccionSobrePropuesta,
  AlojamientoVista,
  DatosAlojamientoNuevo,
  EstadoPropuesta,
  PropuestaVista,
  ValorVoto,
} from '@viajes/compartido';
import { CLIENTE_PROPUESTAS } from '../clientes/propuestas';
import { useViajeStore } from './viaje';

/** Propuestas del viaje abierto. Las actividades se suman en F4. */
export const usePropuestasStore = defineStore('propuestas', () => {
  const cliente = inject(CLIENTE_PROPUESTAS);
  if (!cliente) throw new Error('Falta inyectar ClientePropuestas');

  const viaje = useViajeStore();
  /** Las propuestas siempre son del viaje abierto, aunque se entre directo a una pantalla de alta. */
  const viajeId = () => {
    if (!viaje.actual) throw new Error('No hay un viaje abierto');
    return viaje.actual.id;
  };
  const alojamientos = ref<AlojamientoVista[]>([]);
  const filtro = ref<EstadoPropuesta | ''>('');

  async function cargarAlojamientos() {
    alojamientos.value = await cliente!.listarAlojamientos(viajeId(), filtro.value || undefined);
  }

  async function proponerAlojamiento(datos: DatosAlojamientoNuevo) {
    const nuevo = await cliente!.proponerAlojamiento(viajeId(), datos);
    alojamientos.value = [...alojamientos.value, nuevo];
    return nuevo;
  }

  /** Reemplaza los datos comunes de una propuesta en la lista, conservando los propios del tipo. */
  function actualizar(vista: PropuestaVista) {
    alojamientos.value = alojamientos.value.map((a) =>
      a.id === vista.id ? { ...a, ...vista, tipo: 'ALOJAMIENTO' } : a,
    );
  }

  async function votar(propuestaId: string, valor: ValorVoto) {
    actualizar(await cliente!.votar(viajeId(), propuestaId, valor));
  }

  async function desvotar(propuestaId: string) {
    actualizar(await cliente!.desvotar(viajeId(), propuestaId));
  }

  async function resolver(propuestaId: string, accion: AccionSobrePropuesta) {
    const { propuesta } = await cliente!.resolver(viajeId(), propuestaId, accion);
    actualizar(propuesta);
  }

  return {
    alojamientos,
    filtro,
    cargarAlojamientos,
    proponerAlojamiento,
    votar,
    desvotar,
    resolver,
  };
});
