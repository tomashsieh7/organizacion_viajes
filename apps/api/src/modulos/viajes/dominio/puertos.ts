import type { DetalleViaje, Moneda, Participante, ResumenViaje, Rol } from '@viajes/compartido';
import type { Viaje } from './viaje.js';

/** Escritura del agregado Viaje. */
export interface RepositorioViajes {
  /** Carga el viaje bloqueándolo hasta el fin de la transacción, para modificarlo sin carreras. */
  obtenerParaModificar(viajeId: string): Promise<Viaje | null>;
  /** Inserta o actualiza el viaje y sus membresías. */
  guardar(viaje: Viaje): Promise<void>;
}

/** Lectura del agregado sin bloquearlo, para consultas que usan sus reglas (por ejemplo, RN-M1). */
export interface LectorDeViajes {
  obtener(viajeId: string): Promise<Viaje | null>;
}

/** Saldos que el módulo de viajes necesita consultar para las bajas (RN-E3). */
export interface ConsultaDeudas {
  /** Total que el usuario debe al resto del grupo, en la unidad mínima de la moneda. */
  totalAdeudado(viajeId: string, usuarioId: string): Promise<number>;
}

/** RN-E6: si el usuario tiene saldos pendientes a favor o en contra en el viaje. */
export interface ConsultaSaldosPendientes {
  tieneSaldosPendientes(viajeId: string, usuarioId: string): Promise<boolean>;
}

/** RN-E5: al darse de baja se retiran los votos en propuestas pendientes. */
export interface RetiroDeVotos {
  retirarVotosPendientes(viajeId: string, usuarioId: string): Promise<void>;
}

/** Busca usuarios registrados por una forma de ingreso (D7); la implementa el módulo de autenticación. */
export interface BuscadorDeUsuarios {
  buscarPorIdentificador(tipo: 'EMAIL_CONTRASENA', valor: string): Promise<string | null>;
}

export interface Acceso {
  rol: Rol;
}

/** Lecturas para mostrar viajes y participantes, y para los middlewares de acceso. */
export interface ConsultaViajes {
  obtenerAcceso(viajeId: string, usuarioId: string): Promise<Acceso | null>;
  listarDeUsuario(usuarioId: string): Promise<ResumenViaje[]>;
  obtenerDetalle(
    viajeId: string,
    usuarioId: string,
  ): Promise<Omit<DetalleViaje, 'miDeudaPendiente'> | null>;
  listarParticipantes(viajeId: string): Promise<Participante[]>;
  obtenerParticipante(viajeId: string, usuarioId: string): Promise<Participante | null>;
  listarMonedas(): Promise<Moneda[]>;
  existeMoneda(codigo: string): Promise<boolean>;
}

/** Repositorios disponibles dentro de una transacción del módulo de viajes. */
export interface ReposViajes {
  viajes: RepositorioViajes;
  deudas: ConsultaDeudas;
  votos: RetiroDeVotos;
}
