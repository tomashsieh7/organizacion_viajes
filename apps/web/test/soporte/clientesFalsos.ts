import { createPinia, setActivePinia } from 'pinia';
import type { DetalleViaje, Participante, Usuario } from '@viajes/compartido';
import { CLIENTE_AUTH, type ClienteAuth } from '../../src/clientes/auth';
import { CLIENTE_VIAJES, type ClienteViajes } from '../../src/clientes/viajes';
import { ErrorDeApi } from '../../src/clientes/http';

export const ANA: Usuario = { id: 'ana', nombre: 'Ana', apodo: null };
export const TOMAS: Participante = {
  usuarioId: 'tomas',
  nombre: 'Tomás',
  apodo: 'Tomi',
  rol: 'VIAJERO',
};

export function detalle(miRol: 'ADMIN' | 'VIAJERO', miDeudaPendiente = 0): DetalleViaje {
  return {
    id: 'v1',
    nombre: 'Bariloche',
    destino: 'Bariloche',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-16',
    moneda: { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 },
    miRol,
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
export function montaje(auth: ClienteAuth, viajes: ClienteViajes) {
  const pinia = createPinia();
  setActivePinia(pinia);
  return {
    global: {
      plugins: [pinia],
      provide: { [CLIENTE_AUTH as symbol]: auth, [CLIENTE_VIAJES as symbol]: viajes },
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  };
}

export const errorDeApi = (codigo: string, mensaje: string, estado = 400) =>
  new ErrorDeApi(estado, codigo, mensaje);
