import type { DatosGastoNuevo, ModoDivision } from '@viajes/compartido';
import type { Config } from './config.js';
import { BusDeEventosEnMemoria } from './compartido/eventos.js';
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
  ConsultarAcceso,
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
  RepositorioMensajesPrisma,
} from './modulos/chat/infraestructura/prisma.js';
import { ParticipacionSegunViajes } from './modulos/chat/infraestructura/participacion.js';
import {
  NotificadorViajeSocketIO,
  type EspacioChat,
} from './modulos/chat/infraestructura/socketIO.js';
import {
  AnotarGasto,
  ConsultarDeudas,
  ConsultarGastos,
  RegistrarPago,
} from './modulos/gastos/casos-de-uso/casosDeUsoGastos.js';
import {
  DivisionArbitraria,
  DivisionEnPartesIguales,
  type EstrategiaDivision,
} from './modulos/gastos/dominio/division.js';
import type { ReposGastos } from './modulos/gastos/dominio/puertos.js';
import {
  ConsultaCategoriasPrisma,
  ConsultaGastosPrisma,
  ConsultaSaldosPrisma,
  RepositorioDeudasPrisma,
  RepositorioGastosPrisma,
} from './modulos/gastos/infraestructura/prisma.js';
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
  ConsultaSaldosPendientesPrisma,
  ConsultaViajesPrisma,
  RepositorioViajesPrisma,
  RetiroDeVotosPrisma,
} from './modulos/viajes/infraestructura/prisma.js';

/** RN-G4: estrategia de división para cada modo; un modo nuevo se agrega acá (abierto/cerrado). */
const DIVISIONES: Record<ModoDivision, (datos: DatosGastoNuevo) => EstrategiaDivision> = {
  IGUALES: () => new DivisionEnPartesIguales(),
  ARBITRARIA: (datos) =>
    new DivisionArbitraria(new Map((datos.partes ?? []).map((p) => [p.usuarioId, p.monto]))),
};

/**
 * Punto de composición (Composition Root): el único lugar donde se eligen las implementaciones
 * concretas y se inyectan en los casos de uso (D14).
 */
export interface Contenedor {
  config: Config;
  prisma: PrismaClient;
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
    consultarAcceso: ConsultarAcceso;
  };
  gastos: {
    anotar: AnotarGasto;
    consultar: ConsultarGastos;
    deudas: ConsultarDeudas;
    pagar: RegistrarPago;
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
    /** Suscribe el notificador de Socket.IO a los eventos del viaje; se llama al abrir `/chat`. */
    conectarNotificador(espacio: EspacioChat): void;
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
  const viajesSinBloqueo = new RepositorioViajesPrisma(prisma);
  const saldosPendientes = new ConsultaSaldosPendientesPrisma(prisma);

  // Propuestas (comunes a alojamientos y actividades)
  const unidadPropuestas = new UnidadDeTrabajoPrisma<ReposPropuestas>(prisma, (tx) => ({
    propuestas: new RepositorioPropuestasPrisma(tx),
  }));
  const consultasPropuestas = new ConsultaPropuestasPrisma(prisma);

  // Actividades: las políticas de superposición (P10) y de opciones (P9) se eligen acá.
  const superposicion = new SinSuperposicionConConfirmadas();
  const unidadActividades = new UnidadDeTrabajoPrisma<ReposActividades>(prisma, (tx) => ({
    actividades: new RepositorioActividadesPrisma(tx, new RepositorioPropuestasPrisma(tx)),
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
      const propuestas = new RepositorioPropuestasPrisma(tx);
      const actividades = new RepositorioActividadesPrisma(tx, propuestas);
      return {
        propuestas: new PropuestasConAgendaBloqueadaPrimero(propuestas, actividades),
        actividades,
      };
    },
  );
  const reglasDeResolucion = [
    new ReglaSuperposicionAlConfirmar(superposicion),
    new ReglaOpcionesAlConfirmar(new DenegarOpcionesRestantes()),
  ];

  // Itinerario
  const consultaItinerario = new ConsultaItinerarioPrisma(prisma);

  // Gastos
  const categorias = new ConsultaCategoriasPrisma(prisma);
  const consultaSaldos = new ConsultaSaldosPrisma(prisma);

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
      consultarAcceso: new ConsultarAcceso(viajesSinBloqueo, saldosPendientes),
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
    gastos: {
      anotar: new AnotarGasto({
        unidad: new UnidadDeTrabajoPrisma<ReposGastos>(prisma, (tx) => ({
          gastos: new RepositorioGastosPrisma(tx),
          deudas: new RepositorioDeudasPrisma(tx),
        })),
        viajes: viajesSinBloqueo,
        categorias,
        division: (datos) => DIVISIONES[datos.modoDivision](datos),
        reloj,
      }),
      consultar: new ConsultarGastos(new ConsultaGastosPrisma(prisma), categorias),
      deudas: new ConsultarDeudas(consultaSaldos),
      pagar: new RegistrarPago({
        unidad: new UnidadDeTrabajoPrisma<Pick<ReposGastos, 'deudas'>>(prisma, (tx) => ({
          deudas: new RepositorioDeudasPrisma(tx),
        })),
        viajes: viajesSinBloqueo,
        saldos: consultaSaldos,
        reloj,
      }),
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
      conectarNotificador: (espacio) =>
        new ReenviarEventosDelViaje(saldosPendientes).suscribir(
          eventos,
          new NotificadorViajeSocketIO(espacio),
        ),
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
