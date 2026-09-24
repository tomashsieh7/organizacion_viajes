import { defineStore } from 'pinia';
import { inject, ref } from 'vue';
import type {
  AccionSobrePropuesta,
  ActividadVista,
  AlojamientoVista,
  DatosActividadNueva,
  DatosAlojamientoNuevo,
  EstadoPropuesta,
  PropuestaVista,
  ValorVoto,
} from '@viajes/compartido';
import { CLIENTE_PROPUESTAS } from '../clientes/propuestas';
import { useViajeStore } from './viaje';

/** Propuestas del viaje abierto: alojamientos y actividades, con votos y resolución comunes. */
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
  const actividades = ref<ActividadVista[]>([]);
  const filtro = ref<EstadoPropuesta | ''>('');
  const filtroActividades = ref<EstadoPropuesta | ''>('');

  async function cargarAlojamientos() {
    alojamientos.value = await cliente!.listarAlojamientos(viajeId(), filtro.value || undefined);
  }

  async function proponerAlojamiento(datos: DatosAlojamientoNuevo) {
    const nuevo = await cliente!.proponerAlojamiento(viajeId(), datos);
    alojamientos.value = [...alojamientos.value, nuevo];
    return nuevo;
  }

  async function cargarActividades() {
    actividades.value = await cliente!.listarActividades(
      viajeId(),
      filtroActividades.value || undefined,
    );
  }

  function obtenerActividad(actividadId: string) {
    return cliente!.obtenerActividad(viajeId(), actividadId);
  }

  async function proponerActividad(datos: DatosActividadNueva) {
    const nueva = await cliente!.proponerActividad(viajeId(), datos);
    actividades.value = [...actividades.value, nueva];
    return nueva;
  }

  async function proponerAlternativa(actividadId: string, datos: DatosActividadNueva) {
    const nueva = await cliente!.proponerAlternativa(viajeId(), actividadId, datos);
    actividades.value = [...actividades.value, nueva];
    return nueva;
  }

  /** Reemplaza los datos comunes de una propuesta en su lista, conservando los propios del tipo. */
  function actualizar(vista: PropuestaVista) {
    if (vista.tipo === 'ALOJAMIENTO') {
      alojamientos.value = alojamientos.value.map((a) =>
        a.id === vista.id ? { ...a, ...vista, tipo: 'ALOJAMIENTO' } : a,
      );
    } else {
      actividades.value = actividades.value.map((a) =>
        a.id === vista.id ? { ...a, ...vista, tipo: 'ACTIVIDAD' } : a,
      );
    }
  }

  async function votar(propuestaId: string, valor: ValorVoto) {
    actualizar(await cliente!.votar(viajeId(), propuestaId, valor));
  }

  async function desvotar(propuestaId: string) {
    actualizar(await cliente!.desvotar(viajeId(), propuestaId));
  }

  /**
   * Resuelve la propuesta. Si la resolución cambió otras (RN-R4: las demás opciones de una
   * actividad), se recarga la lista para mostrar sus estados nuevos.
   */
  async function resolver(propuestaId: string, accion: AccionSobrePropuesta) {
    const { propuesta, afectadas } = await cliente!.resolver(viajeId(), propuestaId, accion);
    actualizar(propuesta);
    if (afectadas.length > 0 && propuesta.tipo === 'ACTIVIDAD') await cargarActividades();
  }

  return {
    alojamientos,
    actividades,
    filtro,
    filtroActividades,
    cargarAlojamientos,
    proponerAlojamiento,
    cargarActividades,
    obtenerActividad,
    proponerActividad,
    proponerAlternativa,
    votar,
    desvotar,
    resolver,
  };
});
