import type { DatosGastoNuevo, ModoDivision } from '@viajes/compartido';
import type { Config } from './config.js';
import { BusDeEventosEnMemoria } from './comun/eventos.js';
import { crearClientePrisma, type PrismaClient } from './comun/infraestructura/clientePrisma.js';
import { UnidadDeTrabajoPrisma } from './comun/infraestructura/unidadDeTrabajoPrisma.js';
import { relojDelSistema, type Reloj } from './comun/reloj.js';
import { CerrarSesion } from './modulos/auth/casos-de-uso/cerrarSesion.js';
import { IniciarSesion } from './modulos/auth/casos-de-uso/iniciarSesion.js';
import { ObtenerPerfil } from './modulos/auth/casos-de-uso/obtenerPerfil.js';
import { ObtenerUsuarioDeSesion } from './modulos/auth/casos-de-uso/obtenerUsuarioDeSesion.js';
import { Registrarse } from './modulos/auth/casos-de-uso/registrarse.js';
import { EmailContrasena } from './modulos/auth/dominio/emailContrasena.js';
import type { SesionCerrada } from './modulos/auth/dominio/eventos.js';
import { ServicioDeSesiones } from './modulos/auth/dominio/servicioDeSesiones.js';
import { GeneradorDeTokensCripto } from './modulos/auth/infraestructura/generadorDeTokensCripto.js';
import { HasheadorArgon2 } from './modulos/auth/infraestructura/hasheadorArgon2.js';
import { BuscadorDeUsuariosPrisma } from './modulos/auth/infraestructura/buscadorDeUsuariosPrisma.js';
import { RepositorioCuentasPrisma } from './modulos/auth/infraestructura/repositorioCuentasPrisma.js';
import { RepositorioSesionesPrisma } from './modulos/auth/infraestructura/repositorioSesionesPrisma.js';
import { AgregarViajero } from './modulos/viajes/casos-de-uso/agregarViajero.js';
import { ConsultarAcceso } from './modulos/viajes/casos-de-uso/consultarAcceso.js';
import { ConsultarViajes } from './modulos/viajes/casos-de-uso/consultarViajes.js';
import { CrearViaje } from './modulos/viajes/casos-de-uso/crearViaje.js';
import { EliminarParticipante } from './modulos/viajes/casos-de-uso/eliminarParticipante.js';
import { SalirDelViaje } from './modulos/viajes/casos-de-uso/salirDelViaje.js';
import { TransferirAdministracion } from './modulos/viajes/casos-de-uso/transferirAdministracion.js';
import type { DependenciasViajes } from './modulos/viajes/casos-de-uso/dependencias.js';
import type { ConsultaViajes, ReposViajes } from './modulos/viajes/dominio/puertos.js';
import { ConsultarCronograma } from './modulos/itinerario/casos-de-uso/consultarCronograma.js';
import { ConsultarMapa } from './modulos/itinerario/casos-de-uso/consultarMapa.js';
import { ConsultarMensajes } from './modulos/chat/casos-de-uso/consultarMensajes.js';
import { EnviarMensaje } from './modulos/chat/casos-de-uso/enviarMensaje.js';
import { ReenviarEventosDelViaje } from './modulos/chat/casos-de-uso/reenviarEventosDelViaje.js';
import { UnirseAlChat } from './modulos/chat/casos-de-uso/unirseAlChat.js';
import { ConsultaMensajesPrisma } from './modulos/chat/infraestructura/consultaMensajesPrisma.js';
import { RepositorioMensajesPrisma } from './modulos/chat/infraestructura/repositorioMensajesPrisma.js';
import { ParticipacionSegunViajes } from './modulos/chat/infraestructura/participacionSegunViajes.js';
import {
  cortarConexionesDeSesion,
  type EspacioChat,
} from './modulos/chat/infraestructura/gatewayChat.js';
import { NotificadorViajeSocketIO } from './modulos/chat/infraestructura/notificadorViajeSocketIO.js';
import { AnotarGasto } from './modulos/gastos/casos-de-uso/anotarGasto.js';
import { ConsultarDeudas } from './modulos/gastos/casos-de-uso/consultarDeudas.js';
import { ConsultarGastos } from './modulos/gastos/casos-de-uso/consultarGastos.js';
import { RegistrarPago } from './modulos/gastos/casos-de-uso/registrarPago.js';
import { DivisionArbitraria } from './modulos/gastos/dominio/divisionArbitraria.js';
import { DivisionEnPartesIguales } from './modulos/gastos/dominio/divisionEnPartesIguales.js';
import type { EstrategiaDivision } from './modulos/gastos/dominio/estrategiaDivision.js';
import type { ReposGastos } from './modulos/gastos/dominio/puertos.js';
import { ConsultaCategoriasPrisma } from './modulos/gastos/infraestructura/consultaCategoriasPrisma.js';
import { ConsultaGastosPrisma } from './modulos/gastos/infraestructura/consultaGastosPrisma.js';
import { ConsultaSaldosPrisma } from './modulos/gastos/infraestructura/consultaSaldosPrisma.js';
import { RepositorioDeudasPrisma } from './modulos/gastos/infraestructura/repositorioDeudasPrisma.js';
import { RepositorioGastosPrisma } from './modulos/gastos/infraestructura/repositorioGastosPrisma.js';
import { ConsultaItinerarioPrisma } from './modulos/itinerario/infraestructura/consultaItinerarioPrisma.js';
import { ConsultarAlojamientos } from './modulos/alojamientos/casos-de-uso/consultarAlojamientos.js';
import { ProponerAlojamiento } from './modulos/alojamientos/casos-de-uso/proponerAlojamiento.js';
import type { ReposAlojamientos } from './modulos/alojamientos/dominio/puertos.js';
import { ConsultaAlojamientosPrisma } from './modulos/alojamientos/infraestructura/consultaAlojamientosPrisma.js';
import { RepositorioAlojamientosPrisma } from './modulos/alojamientos/infraestructura/repositorioAlojamientosPrisma.js';
import { ResolverPropuesta } from './modulos/propuestas/casos-de-uso/resolverPropuesta.js';
import { Votar } from './modulos/propuestas/casos-de-uso/votar.js';
import type { ReposPropuestas } from './modulos/propuestas/dominio/puertos.js';
import { ConsultarActividades } from './modulos/actividades/casos-de-uso/consultarActividades.js';
import { ProponerActividad } from './modulos/actividades/casos-de-uso/proponerActividad.js';
import { ProponerAlternativa } from './modulos/actividades/casos-de-uso/proponerAlternativa.js';
import type { DependenciasProponerActividad } from './modulos/actividades/casos-de-uso/dependencias.js';
import { PropuestasConAgendaBloqueadaPrimero } from './modulos/actividades/casos-de-uso/propuestasConAgendaBloqueadaPrimero.js';
import { ReglaOpcionesAlConfirmar } from './modulos/actividades/casos-de-uso/reglaOpcionesAlConfirmar.js';
import { ReglaSuperposicionAlConfirmar } from './modulos/actividades/casos-de-uso/reglaSuperposicionAlConfirmar.js';
import type {
  ReposActividades,
  ReposResolucionConActividades,
} from './modulos/actividades/dominio/puertos.js';
import { ConsultaActividadesPrisma } from './modulos/actividades/infraestructura/consultaActividadesPrisma.js';
import { RepositorioActividadesPrisma } from './modulos/actividades/infraestructura/repositorioActividadesPrisma.js';
import { ConsultaFechasDeViajePrisma } from './modulos/propuestas/infraestructura/consultaFechasDeViajePrisma.js';
import { ConsultaOrigenesDePropuestasPrisma } from './modulos/propuestas/infraestructura/consultaOrigenesDePropuestasPrisma.js';
import { ConsultaPropuestasPrisma } from './modulos/propuestas/infraestructura/consultaPropuestasPrisma.js';
import { RepositorioPropuestasPrisma } from './modulos/propuestas/infraestructura/repositorioPropuestasPrisma.js';
import { ConsultaDeudasPrisma } from './modulos/viajes/infraestructura/consultaDeudasPrisma.js';
import { ConsultaSaldosPendientesPrisma } from './modulos/viajes/infraestructura/consultaSaldosPendientesPrisma.js';
import { ConsultaViajesPrisma } from './modulos/viajes/infraestructura/consultaViajesPrisma.js';
import { LectorDeViajesCompartidoPrisma } from './modulos/viajes/infraestructura/lectorDeViajesCompartidoPrisma.js';
import { RepositorioViajesPrisma } from './modulos/viajes/infraestructura/repositorioViajesPrisma.js';
import { RetiroDeVotosPrisma } from './modulos/viajes/infraestructura/retiroDeVotosPrisma.js';

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
    hashDeToken(token: string): string;
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
    votar: Votar;
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
    /**
     * Suscribe el notificador de Socket.IO a los eventos del viaje y corta las conexiones de las
     * sesiones que se cierran; se llama al abrir `/chat`.
     */
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
    eventos,
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
    viajes: new LectorDeViajesCompartidoPrisma(tx),
  }));
  const consultasPropuestas = new ConsultaPropuestasPrisma(prisma);

  // Actividades
  const unidadActividades = new UnidadDeTrabajoPrisma<ReposActividades>(prisma, (tx) => ({
    actividades: new RepositorioActividadesPrisma(tx, new RepositorioPropuestasPrisma(tx)),
  }));
  const origenesDePropuestas = new ConsultaOrigenesDePropuestasPrisma(prisma);
  const depsActividades: DependenciasProponerActividad = {
    unidad: unidadActividades,
    fechas: new ConsultaFechasDeViajePrisma(prisma),
    reloj,
    origenes: origenesDePropuestas,
  };
  // La resolución de propuestas suma las reglas de actividades sin modificar ResolverPropuesta.
  const unidadResolucion = new UnidadDeTrabajoPrisma<ReposResolucionConActividades>(
    prisma,
    (tx) => {
      const propuestas = new RepositorioPropuestasPrisma(tx);
      const actividades = new RepositorioActividadesPrisma(tx, propuestas);
      const viajes = new RepositorioViajesPrisma(tx);
      return {
        propuestas: new PropuestasConAgendaBloqueadaPrimero(propuestas, actividades),
        actividades,
        // Resolver modifica la agenda: el viaje se toma con FOR UPDATE desde el principio, como
        // en las bajas y los traspasos, para no subir después un bloqueo compartido.
        viajes: { obtener: (viajeId) => viajes.obtenerParaModificar(viajeId) },
      };
    },
  );
  const reglasDeResolucion = [new ReglaSuperposicionAlConfirmar(), new ReglaOpcionesAlConfirmar()];

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
      hashDeToken: (token) => sesiones.hashDeToken(token),
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
          viajes: new LectorDeViajesCompartidoPrisma(tx),
        })),
        categorias,
        division: (datos) => DIVISIONES[datos.modoDivision](datos),
        reloj,
      }),
      consultar: new ConsultarGastos(new ConsultaGastosPrisma(prisma), categorias),
      deudas: new ConsultarDeudas(consultaSaldos),
      pagar: new RegistrarPago({
        unidad: new UnidadDeTrabajoPrisma<Pick<ReposGastos, 'deudas' | 'viajes'>>(prisma, (tx) => ({
          deudas: new RepositorioDeudasPrisma(tx),
          viajes: new LectorDeViajesCompartidoPrisma(tx),
        })),
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
      conectarNotificador: (espacio) => {
        new ReenviarEventosDelViaje(saldosPendientes).suscribir(
          eventos,
          new NotificadorViajeSocketIO(espacio),
        );
        eventos.suscribir<SesionCerrada>('auth.sesion-cerrada', (e) =>
          cortarConexionesDeSesion(espacio, e.tokenHash),
        );
      },
    },
    itinerario: {
      cronograma: new ConsultarCronograma(viajesSinBloqueo, consultaItinerario),
      mapa: new ConsultarMapa(viajesSinBloqueo, consultaItinerario),
    },
    alojamientos: {
      proponer: new ProponerAlojamiento(
        unidadAlojamientos,
        new ConsultaFechasDeViajePrisma(prisma),
        reloj,
        origenesDePropuestas,
      ),
      consultar: new ConsultarAlojamientos(new ConsultaAlojamientosPrisma(prisma)),
    },
  };
}
