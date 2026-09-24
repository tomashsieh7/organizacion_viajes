import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { defineComponent, h } from 'vue';
import {
  sumarMinutos,
  type ActividadVista,
  type DetalleViaje,
  type MensajeVista,
  type PaginaDeMensajes,
  type Participante,
  type Usuario,
} from '@viajes/compartido';
import { CLIENTE_AUTH, type ClienteAuth } from '../../src/clientes/auth';
import { CLIENTE_VIAJES, type ClienteViajes } from '../../src/clientes/viajes';
import { ErrorDeApi } from '../../src/clientes/http';
import { useViajeStore } from '../../src/stores/viaje';
import type { ClienteChat, ConexionChat, OyentesChat } from '../../src/clientes/chat';
import type { ClienteGastos } from '../../src/clientes/gastos';
import { vi } from 'vitest';

export const ANA: Usuario = { id: 'ana', nombre: 'Ana', apodo: null };
export const TOMAS: Participante = {
  usuarioId: 'tomas',
  nombre: 'Tomás',
  apodo: 'Tomi',
  rol: 'VIAJERO',
};

export function detalle(
  miRol: 'ADMIN' | 'VIAJERO',
  miDeudaPendiente = 0,
  miAcceso: 'COMPLETO' | 'SOLO_SALDOS' = 'COMPLETO',
): DetalleViaje {
  return {
    id: 'v1',
    nombre: 'Bariloche',
    destino: 'Bariloche',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-16',
    moneda: { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 },
    miRol,
    miAcceso,
    miDeudaPendiente,
    cantidadParticipantes: 2,
  };
}

const noImplementado = () => Promise.reject(new Error('no usado en esta prueba'));

export function clienteAuthFalso(parcial: Partial<ClienteAuth> = {}): ClienteAuth {
  return {
    registrarse: noImplementado,
    ingresar: noImplementado,
    cerrarSesion: noImplementado,
    yo: async () => ANA,
    ...parcial,
  };
}

export function clienteViajesFalso(parcial: Partial<ClienteViajes> = {}): ClienteViajes {
  return {
    monedas: async () => [],
    listar: async () => [],
    crear: noImplementado,
    obtener: async () => detalle('ADMIN'),
    participantes: async () => [
      { usuarioId: 'ana', nombre: 'Ana', apodo: null, rol: 'ADMIN' },
      TOMAS,
    ],
    agregarViajero: noImplementado,
    eliminarParticipante: noImplementado,
    salir: noImplementado,
    transferirAdministracion: noImplementado,
    ...parcial,
  };
}

/** Opciones de montaje con Pinia y los clientes falsos inyectados. */
export function montaje(
  auth: ClienteAuth,
  viajes: ClienteViajes,
  otros: Record<symbol, unknown> = {},
) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const provide: Record<symbol, unknown> = {
    [CLIENTE_AUTH as symbol]: auth,
    [CLIENTE_VIAJES as symbol]: viajes,
    ...otros,
  };
  return {
    global: {
      plugins: [pinia],
      provide,
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  };
}

export const errorDeApi = (codigo: string, mensaje: string, estado = 400) =>
  new ErrorDeApi(estado, codigo, mensaje);

/** Actividad de ejemplo para las pruebas de la web. */
export function actividad(
  id: string,
  titulo: string,
  cambios: {
    estado?: ActividadVista['estado'];
    alternativaDe?: { id: string; titulo: string } | null;
    horaInicio?: string;
    duracionMin?: number;
  } = {},
): ActividadVista {
  const horaInicio = cambios.horaInicio ?? '10:00';
  const duracionMin = cambios.duracionMin ?? 120;
  return {
    id,
    tipo: 'ACTIVIDAD',
    estado: cambios.estado ?? 'PENDIENTE',
    descripcion: 'desc',
    precio: null,
    ubicacion: 'Lago',
    latitud: -41,
    longitud: -71,
    autor: { usuarioId: 'tomas', nombre: 'Tomás' },
    votosAFavor: 0,
    votosEnContra: 0,
    miVoto: null,
    creadaEn: '2026-09-24T12:00:00.000Z',
    resueltaEn: null,
    actividad: {
      titulo,
      fecha: '2026-12-11',
      horaInicio,
      horaFin: sumarMinutos(horaInicio, duracionMin),
      duracionMin,
      alternativaDe: cambios.alternativaDe ?? null,
    },
  };
}

/**
 * Abre el viaje antes de montar una vista que lo necesita, como hace `ViajeLayout`. El store se
 * crea dentro de un componente auxiliar para que pueda inyectar su cliente.
 */
export async function abrirViaje(opciones: ReturnType<typeof montaje>, viajeId = 'v1') {
  let viaje!: ReturnType<typeof useViajeStore>;
  mount(
    defineComponent({
      setup: () => ((viaje = useViajeStore()), () => h('div')),
    }),
    opciones,
  );
  await viaje.abrir(viajeId);
}

/** Cliente de chat falso: guarda los oyentes para simular lo que llega del servidor. */
export function clienteChatFalso(historial: PaginaDeMensajes = { mensajes: [], hayMas: false }) {
  let oyentes: OyentesChat | undefined;
  const conexion = {
    unirse: vi.fn(async () => undefined),
    salir: vi.fn(),
    enviar: vi.fn<ConexionChat['enviar']>(),
    cerrar: vi.fn(),
  };
  const cliente = {
    historial: vi.fn<ClienteChat['historial']>(async () => historial),
    conectar: vi.fn((o: OyentesChat) => ((oyentes = o), conexion)),
  };
  return { cliente, conexion, servidor: () => oyentes! };
}

export function mensaje(
  id: string,
  autorId: string,
  contenido: string,
  idTemporal?: string,
): MensajeVista {
  return {
    id,
    viajeId: 'v1',
    autor: { id: autorId, nombre: autorId === 'ana' ? 'Ana' : 'Tomás', apodo: null },
    contenido,
    enviadoEn: '2026-09-24T12:00:00.000Z',
    ...(idTemporal ? { idTemporal } : {}),
  };
}

export function clienteGastosFalso(parcial: Partial<ClienteGastos> = {}): ClienteGastos {
  return {
    categorias: async () => [
      { id: 'c-comida', codigo: 'COMIDA', nombre: 'Comida' },
      { id: 'c-otros', codigo: 'OTROS', nombre: 'Otros' },
    ],
    listar: async () => [],
    anotar: noImplementado,
    deudas: async () => [],
    ...parcial,
  };
}
