import { resumirPlanificacion } from '@viajes/compartido';
import { defineStore } from 'pinia';
import { computed, inject, ref } from 'vue';
import type {
  AccionSobrePropuesta,
  ActividadVista,
  AlojamientoVista,
  DatosActividadNueva,
  DatosAlojamientoNuevo,
  PropuestaVista,
  ValorVoto,
} from '@viajes/compartido';
import { CLIENTE_PROPUESTAS } from '../clientes/propuestas';
import { useViajeStore } from './viajes';

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

  let generacion = 0;
  const alojamientosCargados = ref(false);
  const actividadesCargadas = ref(false);
  const planificacion = computed(() => {
    if (!viaje.actual || viaje.actual.miAcceso === 'SOLO_SALDOS') return null;
    if (!alojamientosCargados.value || !actividadesCargadas.value)
      return viaje.actual.planificacion;
    return resumirPlanificacion(viaje.actual, [...alojamientos.value, ...actividades.value]);
  });

  // Si hubo un cambio con una lista todavía sin cargar, el resumen previo ya no es fiable.
  function registrarCambio() {
    // Una lectura iniciada antes de guardar no debe sobrescribir el resultado de ese cambio.
    generacion++;
    if (viaje.actual && (!alojamientosCargados.value || !actividadesCargadas.value))
      viaje.actual.planificacion = null;
  }

  const sinDia = computed(() =>
    [...alojamientos.value, ...actividades.value].filter(
      (p) =>
        (p.estado === 'PENDIENTE' || p.estado === 'CONFIRMADA') &&
        (p.tipo === 'ACTIVIDAD' ? p.actividad.fecha === null : p.alojamiento.fechaDesde === null),
    ),
  );
  async function ubicar(p: ActividadVista | AlojamientoVista, fecha: string) {
    await cliente!.ubicar(viajeId(), p.id, p.tipo, fecha);
    registrarCambio();
    await cargarTodo();
  }

  async function cargarAlojamientos() {
    const id = viajeId();
    const carga = generacion;
    const lista = await cliente!.listarAlojamientos(id);
    if (viaje.actual?.id === id && carga === generacion) {
      alojamientos.value = lista;
      alojamientosCargados.value = true;
    }
  }

  async function proponerAlojamiento(datos: DatosAlojamientoNuevo) {
    const nuevo = await cliente!.proponerAlojamiento(viajeId(), datos);
    registrarCambio();
    alojamientos.value = [...alojamientos.value, nuevo];
    return nuevo;
  }

  async function cargarActividades() {
    const id = viajeId();
    const carga = generacion;
    const lista = await cliente!.listarActividades(id);
    if (viaje.actual?.id === id && carga === generacion) {
      actividades.value = lista;
      actividadesCargadas.value = true;
    }
  }

  /** Para el Resumen: todos los alojamientos y actividades. */
  async function cargarTodo() {
    await Promise.all([cargarAlojamientos(), cargarActividades()]);
  }

  function obtenerActividad(actividadId: string) {
    return cliente!.obtenerActividad(viajeId(), actividadId);
  }

  async function proponerActividad(datos: DatosActividadNueva) {
    const nueva = await cliente!.proponerActividad(viajeId(), datos);
    registrarCambio();
    actividades.value = [...actividades.value, nueva];
    return nueva;
  }

  async function proponerAlternativa(actividadId: string, datos: DatosActividadNueva) {
    const nueva = await cliente!.proponerAlternativa(viajeId(), actividadId, datos);
    registrarCambio();
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
    registrarCambio();
    actualizar(propuesta);
    if (afectadas.length > 0 && propuesta.tipo === 'ACTIVIDAD') await cargarActividades();
  }

  function limpiar() {
    generacion++;
    alojamientosCargados.value = false;
    actividadesCargadas.value = false;
    alojamientos.value = [];
    actividades.value = [];
  }

  return {
    limpiar,
    planificacion,
    sinDia,
    ubicar,
    alojamientos,
    actividades,
    cargarAlojamientos,
    proponerAlojamiento,
    cargarActividades,
    cargarTodo,
    obtenerActividad,
    proponerActividad,
    proponerAlternativa,
    votar,
    desvotar,
    resolver,
  };
});
