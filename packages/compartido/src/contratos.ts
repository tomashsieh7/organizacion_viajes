/** Contenido de toda respuesta de error de la API (decisión D19 de PLAN.md). */
export interface CuerpoError {
  codigo: string;
  mensaje: string;
  detalles?: unknown;
}

export interface RespuestaError {
  error: CuerpoError;
}

/** Respuesta de `GET /api/salud`. */
export interface RespuestaSalud {
  ok: true;
}

export type Rol = 'ADMIN' | 'VIAJERO';

export interface Usuario {
  id: string;
  nombre: string;
  apodo: string | null;
}

export interface RespuestaUsuario {
  usuario: Usuario;
}

export interface Moneda {
  codigo: string;
  nombre: string;
  decimales: number;
}

export interface ResumenViaje {
  id: string;
  nombre: string;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  monedaCodigo: string;
  miRol: Rol;
}

export interface DetalleViaje extends Omit<ResumenViaje, 'monedaCodigo'> {
  moneda: Moneda;
  /** Total que quien consulta debe al resto del grupo, en la unidad mínima de la moneda. */
  miDeudaPendiente: number;
  cantidadParticipantes: number;
}

export interface Participante {
  usuarioId: string;
  nombre: string;
  apodo: string | null;
  rol: Rol;
}

export interface RespuestaBaja {
  bajaConDeuda: boolean;
}

export type EstadoPropuesta = 'PENDIENTE' | 'CONFIRMADA' | 'DENEGADA' | 'CANCELADA';
export type ValorVoto = 'A_FAVOR' | 'EN_CONTRA';
export type AccionSobrePropuesta = 'confirmar' | 'denegar' | 'cancelar';

/** Datos comunes con los que se muestra una propuesta, con el conteo de votos y el voto propio. */
export interface PropuestaVista {
  id: string;
  tipo: 'ACTIVIDAD' | 'ALOJAMIENTO';
  estado: EstadoPropuesta;
  descripcion: string;
  precio: number | null;
  ubicacion: string;
  latitud: number | null;
  longitud: number | null;
  autor: { usuarioId: string; nombre: string };
  votosAFavor: number;
  votosEnContra: number;
  miVoto: ValorVoto | null;
  creadaEn: string;
  resueltaEn: string | null;
}

export interface AlojamientoVista extends PropuestaVista {
  tipo: 'ALOJAMIENTO';
  alojamiento: { nombre: string; fechaDesde: string; fechaHasta: string };
}

export interface RespuestaResolucion {
  propuesta: PropuestaVista;
  /** Otras propuestas que cambiaron de estado como consecuencia (por ejemplo, alternativas denegadas en F4). */
  afectadas: string[];
}

export interface ActividadVista extends PropuestaVista {
  tipo: 'ACTIVIDAD';
  actividad: {
    titulo: string;
    fecha: string;
    horaInicio: string;
    /** Hora de fin calculada con la duración; puede ser del día siguiente. */
    horaFin: string;
    duracionMin: number;
    /** Actividad original de la que esta es alternativa, o null si es una original. */
    alternativaDe: { id: string; titulo: string } | null;
  };
}

/** Actividad confirmada con la que choca una propuesta (detalle del error SUPERPOSICION_HORARIA). */
export interface ConflictoHorario {
  id: string;
  titulo: string;
  fecha: string;
  horaInicio: string;
  duracionMin: number;
}

/** Actividad confirmada tal como la muestran el cronograma y el mapa (CU16 y CU17). */
export interface ActividadDelItinerario {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMin: number;
  ubicacion: string;
  latitud: number;
  longitud: number;
}

/** Alojamiento confirmado en el que se pasa una noche (RN-C3). */
export interface AlojamientoDeLaNoche {
  id: string;
  nombre: string;
  ubicacion: string;
}

export interface DiaDelCronograma {
  fecha: string;
  /** Solo confirmadas, ordenadas por horario (RN-C2); vacía si el día no tiene (RN-C1). */
  actividades: ActividadDelItinerario[];
  /** Alojamientos confirmados de esa noche; el día de salida no cuenta (RN-C3). */
  alojamientos: AlojamientoDeLaNoche[];
}

export interface Cronograma {
  dias: DiaDelCronograma[];
}

export interface PuntoDelRecorrido {
  latitud: number;
  longitud: number;
}

export type AvisoDelMapa = 'SIN_ACTIVIDADES_CONFIRMADAS';

export interface MapaDelDia {
  dia: string;
  /** Días del viaje con al menos una actividad confirmada, para resaltarlos en el selector. */
  diasConActividad: string[];
  /** Actividades confirmadas del día en orden cronológico; su posición es su número en el mapa. */
  actividades: ActividadDelItinerario[];
  /** Puntos de la línea que une las actividades en ese orden (P20). */
  recorrido: PuntoDelRecorrido[];
  aviso: AvisoDelMapa | null;
}

/** Mensaje del chat del viaje (CU19); también es la carga del evento `chat:mensaje`. */
export interface MensajeVista {
  id: string;
  viajeId: string;
  autor: { id: string; nombre: string; apodo: string | null };
  contenido: string;
  enviadoEn: string;
  /** Identificador que puso el cliente al enviarlo, para reemplazar su versión optimista. */
  idTemporal?: string;
}

export interface PaginaDeMensajes {
  /** En orden cronológico, del más viejo al más nuevo. */
  mensajes: MensajeVista[];
  /** Si hay mensajes anteriores al primero de la página. */
  hayMas: boolean;
}

/** Confirmación de los eventos que el cliente envía por Socket.IO. */
export type ConfirmacionSocket<T = object> =
  ({ ok: true } & T) | { ok: false; error: { codigo: string; mensaje: string } };

export interface AvisoMembresiaFinalizada {
  viajeId: string;
  motivo: 'ELIMINADO' | 'RETIRADO';
  /** RN-E6: si conserva acceso a la sección de saldos por tener saldos pendientes. */
  conservaAccesoSaldos: boolean;
}

export interface AvisoAdminCambiado {
  viajeId: string;
  nuevoAdminId: string;
  anteriorAdminId: string;
}

/** Eventos que el servidor emite en el espacio de nombres `/chat`. */
export interface EventosServidorChat {
  'chat:mensaje': (mensaje: MensajeVista) => void;
  'viaje:membresia-finalizada': (aviso: AvisoMembresiaFinalizada) => void;
  'viaje:admin-cambiado': (aviso: AvisoAdminCambiado) => void;
}

/** Eventos que el cliente emite en el espacio de nombres `/chat`, con su confirmación. */
export interface EventosClienteChat {
  'chat:unirse': (datos: { viajeId: string }, confirmar: (r: ConfirmacionSocket) => void) => void;
  'chat:salir': (datos: { viajeId: string }, confirmar?: (r: ConfirmacionSocket) => void) => void;
  'chat:enviar': (
    datos: { viajeId: string; contenido: string; idTemporal: string },
    confirmar: (r: ConfirmacionSocket<{ mensaje: MensajeVista }>) => void,
  ) => void;
}
