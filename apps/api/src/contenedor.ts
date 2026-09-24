import type { Config } from './config.js';
import { BusDeEventosEnMemoria, type BusDeEventos } from './compartido/eventos.js';
import { crearClientePrisma, type PrismaClient } from './compartido/infraestructura/prisma.js';
import { UnidadDeTrabajoPrisma } from './compartido/infraestructura/unidadDeTrabajoPrisma.js';
import { relojDelSistema, type Reloj } from './compartido/reloj.js';
import {
  CerrarSesion,
  IniciarSesion,
  ObtenerPerfil,
  ObtenerUsuarioDeSesion,
  Registrarse,
} from './modulos/auth/casos-de-uso/casosDeUsoAuth.js';
import { EmailContrasena } from './modulos/auth/dominio/emailContrasena.js';
import { ServicioDeSesiones } from './modulos/auth/dominio/servicioDeSesiones.js';
import {
  GeneradorDeTokensCripto,
  HasheadorArgon2,
} from './modulos/auth/infraestructura/adaptadores.js';
import { BuscadorDeUsuariosPrisma } from './modulos/auth/infraestructura/buscadorDeUsuariosPrisma.js';
import {
  RepositorioCuentasPrisma,
  RepositorioSesionesPrisma,
} from './modulos/auth/infraestructura/repositoriosPrisma.js';
import {
  AgregarViajero,
  ConsultarViajes,
  CrearViaje,
  EliminarParticipante,
  SalirDelViaje,
  TransferirAdministracion,
  type DependenciasViajes,
} from './modulos/viajes/casos-de-uso/casosDeUsoViajes.js';
import type { ConsultaViajes, ReposViajes } from './modulos/viajes/dominio/puertos.js';
import {
  ConsultaDeudasPrisma,
  ConsultaViajesPrisma,
  RepositorioViajesPrisma,
  RetiroDeVotosPrisma,
} from './modulos/viajes/infraestructura/prisma.js';

/**
 * Punto de composición (Composition Root): el único lugar donde se eligen las implementaciones
 * concretas y se inyectan en los casos de uso (D14).
 */
export interface Contenedor {
  config: Config;
  prisma: PrismaClient;
  eventos: BusDeEventos;
  auth: {
    registrarse: Registrarse;
    iniciarSesion: IniciarSesion;
    cerrarSesion: CerrarSesion;
    obtenerPerfil: ObtenerPerfil;
    obtenerUsuarioDeSesion: ObtenerUsuarioDeSesion;
  };
  viajes: {
    crearViaje: CrearViaje;
    agregarViajero: AgregarViajero;
    eliminarParticipante: EliminarParticipante;
    salirDelViaje: SalirDelViaje;
    transferirAdministracion: TransferirAdministracion;
    consultar: ConsultarViajes;
    consultas: ConsultaViajes;
  };
}

export interface OpcionesContenedor {
  reloj?: Reloj;
}

export function crearContenedor(config: Config, opciones: OpcionesContenedor = {}): Contenedor {
  const reloj = opciones.reloj ?? relojDelSistema;
  const prisma = crearClientePrisma(config.DATABASE_URL);
  const eventos = new BusDeEventosEnMemoria();

  // Autenticación
  const cuentas = new RepositorioCuentasPrisma(prisma);
  const emailContrasena = new EmailContrasena(cuentas, new HasheadorArgon2());
  const sesiones = new ServicioDeSesiones(
    new RepositorioSesionesPrisma(prisma),
    new GeneradorDeTokensCripto(),
    reloj,
    config.SESION_DIAS * 24 * 60 * 60 * 1000,
  );

  // Viajes
  const unidadViajes = new UnidadDeTrabajoPrisma<ReposViajes>(prisma, (tx) => ({
    viajes: new RepositorioViajesPrisma(tx),
    deudas: new ConsultaDeudasPrisma(tx),
    votos: new RetiroDeVotosPrisma(tx),
  }));
  const depsViajes: DependenciasViajes = { unidad: unidadViajes, eventos, reloj };
  const consultasViajes = new ConsultaViajesPrisma(prisma);

  return {
    config,
    prisma,
    eventos,
    auth: {
      registrarse: new Registrarse(emailContrasena, sesiones),
      iniciarSesion: new IniciarSesion(emailContrasena, cuentas, sesiones),
      cerrarSesion: new CerrarSesion(sesiones),
      obtenerPerfil: new ObtenerPerfil(cuentas),
      obtenerUsuarioDeSesion: new ObtenerUsuarioDeSesion(sesiones),
    },
    viajes: {
      crearViaje: new CrearViaje(depsViajes, consultasViajes),
      agregarViajero: new AgregarViajero(depsViajes, new BuscadorDeUsuariosPrisma(prisma)),
      eliminarParticipante: new EliminarParticipante(depsViajes),
      salirDelViaje: new SalirDelViaje(depsViajes),
      transferirAdministracion: new TransferirAdministracion(depsViajes),
      consultar: new ConsultarViajes(consultasViajes, new ConsultaDeudasPrisma(prisma)),
      consultas: consultasViajes,
    },
  };
}
