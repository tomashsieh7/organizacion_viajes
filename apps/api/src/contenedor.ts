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
  ConsultarCronograma,
  ConsultarMapa,
} from './modulos/itinerario/casos-de-uso/casosDeUsoItinerario.js';
import { RecorridoEnLineaRecta } from './modulos/itinerario/dominio/recorrido.js';
import {
  ConsultarMensajes,
  EnviarMensaje,
  ReenviarEventosDelViaje,
  UnirseAlChat,
} from './modulos/chat/casos-de-uso/casosDeUsoChat.js';
import {
  ConsultaMensajesPrisma,
  ConsultaSaldosPendientesPrisma,
  RepositorioMensajesPrisma,
} from './modulos/chat/infraestructura/prisma.js';
import { ParticipacionSegunViajes } from './modulos/chat/infraestructura/participacion.js';
import { ConsultaItinerarioPrisma } from './modulos/itinerario/infraestructura/prisma.js';
import {
  ConsultarAlojamientos,
  ProponerAlojamiento,
} from './modulos/alojamientos/casos-de-uso/casosDeUsoAlojamientos.js';
import type { ReposAlojamientos } from './modulos/alojamientos/dominio/puertos.js';
import {
  ConsultaAlojamientosPrisma,
  RepositorioAlojamientosPrisma,
} from './modulos/alojamientos/infraestructura/prisma.js';
import {
  ResolverPropuesta,
  Votar,
} from './modulos/propuestas/casos-de-uso/casosDeUsoPropuestas.js';
import type { ReposPropuestas } from './modulos/propuestas/dominio/puertos.js';
import {
  ConsultarActividades,
  ProponerActividad,
  ProponerAlternativa,
  type DependenciasProponerActividad,
} from './modulos/actividades/casos-de-uso/casosDeUsoActividades.js';
import { PropuestasConAgendaBloqueadaPrimero } from './modulos/actividades/casos-de-uso/agendaBloqueadaPrimero.js';
import {
  ReglaOpcionesAlConfirmar,
  ReglaSuperposicionAlConfirmar,
} from './modulos/actividades/casos-de-uso/reglasDeResolucion.js';
import {
  DenegarOpcionesRestantes,
  SinSuperposicionConConfirmadas,
} from './modulos/actividades/dominio/politicas.js';
import type {
  ReposActividades,
  ReposResolucionConActividades,
} from './modulos/actividades/dominio/puertos.js';
import {
  ConsultaActividadesPrisma,
  RepositorioActividadesPrisma,
} from './modulos/actividades/infraestructura/prisma.js';
import {
  ConsultaFechasDeViajePrisma,
  ConsultaPropuestasPrisma,
  RepositorioPropuestasPrisma,
} from './modulos/propuestas/infraestructura/prisma.js';
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
  propuestas: {
    votar: Votar<ReposPropuestas>;
    resolver: ResolverPropuesta<ReposResolucionConActividades>;
  };
  actividades: {
    proponer: ProponerActividad;
    proponerAlternativa: ProponerAlternativa;
    consultar: ConsultarActividades;
  };
  itinerario: {
    cronograma: ConsultarCronograma;
    mapa: ConsultarMapa;
  };
  chat: {
    unirse: UnirseAlChat;
    enviar: EnviarMensaje;
    consultar: ConsultarMensajes;
    reenviarEventos: ReenviarEventosDelViaje;
  };
  alojamientos: {
    proponer: ProponerAlojamiento;
    consultar: ConsultarAlojamientos;
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

  // Propuestas (comunes a alojamientos y actividades)
  const unidadPropuestas = new UnidadDeTrabajoPrisma<ReposPropuestas>(prisma, (tx) => ({
    propuestas: new RepositorioPropuestasPrisma(tx),
  }));
  const consultasPropuestas = new ConsultaPropuestasPrisma(prisma);

  // Actividades: las políticas de superposición (P10) y de opciones (P9) se eligen acá.
  const superposicion = new SinSuperposicionConConfirmadas();
  const unidadActividades = new UnidadDeTrabajoPrisma<ReposActividades>(prisma, (tx) => ({
    actividades: new RepositorioActividadesPrisma(tx),
  }));
  const depsActividades: DependenciasProponerActividad = {
    unidad: unidadActividades,
    fechas: new ConsultaFechasDeViajePrisma(prisma),
    superposicion,
    reloj,
  };
  // La resolución de propuestas suma las reglas de actividades sin modificar ResolverPropuesta (F3).
  const unidadResolucion = new UnidadDeTrabajoPrisma<ReposResolucionConActividades>(
    prisma,
    (tx) => {
      const actividades = new RepositorioActividadesPrisma(tx);
      return {
        propuestas: new PropuestasConAgendaBloqueadaPrimero(
          new RepositorioPropuestasPrisma(tx),
          actividades,
        ),
        actividades,
      };
    },
  );
  const reglasDeResolucion = [
    new ReglaSuperposicionAlConfirmar(superposicion),
    new ReglaOpcionesAlConfirmar(new DenegarOpcionesRestantes()),
  ];

  // Itinerario
  const viajesSinBloqueo = new RepositorioViajesPrisma(prisma);
  const consultaItinerario = new ConsultaItinerarioPrisma(prisma);

  // Chat
  const participacion = new ParticipacionSegunViajes(consultasViajes);
  const consultaMensajes = new ConsultaMensajesPrisma(prisma);

  // Alojamientos
  const unidadAlojamientos = new UnidadDeTrabajoPrisma<ReposAlojamientos>(prisma, (tx) => ({
    alojamientos: new RepositorioAlojamientosPrisma(tx),
  }));

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
    propuestas: {
      votar: new Votar(unidadPropuestas, consultasPropuestas, reloj),
      resolver: new ResolverPropuesta(
        unidadResolucion,
        consultasPropuestas,
        reloj,
        reglasDeResolucion,
      ),
    },
    actividades: {
      proponer: new ProponerActividad(depsActividades),
      proponerAlternativa: new ProponerAlternativa(depsActividades),
      consultar: new ConsultarActividades(new ConsultaActividadesPrisma(prisma)),
    },
    chat: {
      unirse: new UnirseAlChat(participacion),
      enviar: new EnviarMensaje(
        participacion,
        new RepositorioMensajesPrisma(prisma),
        consultaMensajes,
        reloj,
      ),
      consultar: new ConsultarMensajes(consultaMensajes),
      reenviarEventos: new ReenviarEventosDelViaje(new ConsultaSaldosPendientesPrisma(prisma)),
    },
    itinerario: {
      cronograma: new ConsultarCronograma(viajesSinBloqueo, consultaItinerario),
      mapa: new ConsultarMapa(viajesSinBloqueo, consultaItinerario, new RecorridoEnLineaRecta()),
    },
    alojamientos: {
      proponer: new ProponerAlojamiento(
        unidadAlojamientos,
        new ConsultaFechasDeViajePrisma(prisma),
        reloj,
      ),
      consultar: new ConsultarAlojamientos(new ConsultaAlojamientosPrisma(prisma)),
    },
  };
}
