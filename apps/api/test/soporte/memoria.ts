/**
 * Implementaciones en memoria de los puertos, para las pruebas unitarias. Todas trabajan
 * sobre una misma `BaseEnMemoria`, así se comportan como tablas de una misma base. Las pruebas de
 * contrato verifican que se comporten igual que las implementaciones con Prisma.
 */
import {
  sumarMinutos,
  diasEntre,
  type CategoriaGasto,
  type DeudaVista,
  type GastoVista,
  type PagoDeActividad,
  type PagoRegistrado,
  type RolEnDeuda,
  type AvisoAdminCambiado,
  type AvisoMembresiaFinalizada,
  type MensajeVista,
  type PaginaDeMensajes,
  type ActividadDelItinerario,
  type ActividadVista,
  type AlojamientoVista,
  type DetalleViaje,
  type EstadoPropuesta,
  type Moneda,
  type Participante,
  type PropuestaVista,
  type ResumenViaje,
} from '@viajes/compartido';
import { RangoFechas } from '../../src/comun/valores/rangoFechas.js';
import { Intervalo } from '../../src/comun/valores/intervalo.js';
import { Dinero } from '../../src/comun/valores/dinero.js';
import { Deuda, pagoExistente } from '../../src/modulos/gastos/dominio/deuda.js';
import {
  gastoExistente,
  type DatosGasto,
  type Gasto,
} from '../../src/modulos/gastos/dominio/gasto.js';
import type {
  ConsultaCategorias,
  ConsultaGastos,
  ConsultaSaldos,
  ParDeViajeros,
  RepositorioDeudas,
  RepositorioGastos,
} from '../../src/modulos/gastos/dominio/puertos.js';
import {
  mensajeExistente,
  type DatosMensaje,
  type Mensaje,
} from '../../src/modulos/chat/dominio/mensaje.js';
import type {
  ConsultaMensajes,
  NotificadorViaje,
  RepositorioMensajes,
} from '../../src/modulos/chat/dominio/puertos.js';
import type {
  AlojamientoConfirmado,
  ConsultaItinerario,
} from '../../src/modulos/itinerario/dominio/puertos.js';
import {
  Actividad,
  type DetalleActividad,
} from '../../src/modulos/actividades/dominio/actividad.js';
import type { ActividadAgendada } from '../../src/modulos/actividades/dominio/politicas.js';
import type {
  ConsultaActividades,
  RepositorioActividades,
} from '../../src/modulos/actividades/dominio/puertos.js';
import type {
  ConsultaAlojamientos,
  DetalleAlojamiento,
  RepositorioAlojamientos,
} from '../../src/modulos/alojamientos/dominio/puertos.js';
import { Propuesta, type DatosPropuesta } from '../../src/modulos/propuestas/dominio/propuesta.js';
import type {
  ConsultaFechasDeViaje,
  ConsultaOrigenesDePropuestas,
  ConsultaPropuestas,
  OrigenDePropuesta,
  RepositorioPropuestas,
} from '../../src/modulos/propuestas/dominio/puertos.js';
import { ErrorDeDominio } from '../../src/comun/errores.js';
import { normalizarEmail } from '../../src/modulos/auth/dominio/emailContrasena.js';
import type {
  Cuenta,
  CredencialGuardada,
  NuevaCuenta,
  RepositorioCuentas,
  RepositorioSesiones,
  SesionGuardada,
  TipoCredencial,
} from '../../src/modulos/auth/dominio/puertos.js';
import type {
  Acceso,
  AgendaDelViaje,
  BuscadorDeUsuarios,
  ConsultaDeudas,
  ConsultaSaldosPendientes,
  ConsultaViajes,
  LectorDeViajes,
  ReposViajes,
  RepositorioViajes,
  RetiroDeVotos,
} from '../../src/modulos/viajes/dominio/puertos.js';
import { tipoDeAcceso } from '../../src/modulos/viajes/dominio/membresia.js';
import type { PropuestaReacomodable } from '../../src/modulos/viajes/dominio/reacomodo.js';
import { Alojamiento } from '../../src/modulos/alojamientos/dominio/alojamiento.js';
import { Viaje, type DatosViaje } from '../../src/modulos/viajes/dominio/viaje.js';

export interface BaseEnMemoria {
  usuarios: { id: string; nombre: string; apodo: string | null }[];
  credenciales: {
    usuarioId: string;
    tipo: TipoCredencial;
    identificador: string;
    secretoHash: string | null;
  }[];
  sesiones: { usuarioId: string; tokenHash: string; expiraEn: Date; revocadaEn: Date | null }[];
  monedas: Moneda[];
  viajes: DatosViaje[];
  categorias: CategoriaGasto[];
  gastos: DatosGasto[];
  pagos: { id: string; deudaId: string; registradoPorId: string; monto: number; fecha: Date }[];
  deudas: {
    viajeId: string;
    deudorId: string;
    acreedorId: string;
    monto: number;
    id?: string;
    ultimaActualizacion?: Date;
  }[];
  mensajes: DatosMensaje[];
  /** Propuestas con sus votos y, según el tipo, los datos propios del alojamiento o la actividad. */
  propuestas: {
    datos: DatosPropuesta;
    alojamiento?: {
      nombre: string;
      fechaDesde: string | null;
      fechaHasta: string | null;
      noches?: number;
      fechaCambiadaEn?: Date | null;
    };
    actividad?: DetalleActividad;
  }[];
}

export function baseVacia(): BaseEnMemoria {
  return {
    usuarios: [],
    credenciales: [],
    sesiones: [],
    monedas: [{ codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 }],
    viajes: [],
    categorias: [
      { id: '00000000-0000-4000-8000-000000000001', codigo: 'COMIDA', nombre: 'Comida' },
      { id: '00000000-0000-4000-8000-000000000002', codigo: 'TRANSPORTE', nombre: 'Transporte' },
    ],
    gastos: [],
    pagos: [],
    deudas: [],
    mensajes: [],
    propuestas: [],
  };
}

export class RepositorioCuentasEnMemoria implements RepositorioCuentas {
  constructor(private readonly base: BaseEnMemoria) {}

  async crear(datos: NuevaCuenta): Promise<Cuenta> {
    if (
      this.base.credenciales.some(
        (c) => c.tipo === datos.tipo && c.identificador === datos.identificador,
      )
    ) {
      throw new ErrorDeDominio(
        'CONFLICTO',
        'IDENTIFICADOR_EN_USO',
        'La credencial ya está registrada',
      );
    }
    const usuario = { id: crypto.randomUUID(), nombre: datos.nombre, apodo: datos.apodo };
    this.base.usuarios.push(usuario);
    this.base.credenciales.push({
      usuarioId: usuario.id,
      tipo: datos.tipo,
      identificador: datos.identificador,
      secretoHash: datos.secretoHash,
    });
    return { usuarioId: usuario.id, nombre: usuario.nombre, apodo: usuario.apodo };
  }

  async buscarCredencial(
    tipo: TipoCredencial,
    identificador: string,
  ): Promise<CredencialGuardada | null> {
    const c = this.base.credenciales.find(
      (x) => x.tipo === tipo && x.identificador === identificador,
    );
    return c ? { usuarioId: c.usuarioId, secretoHash: c.secretoHash } : null;
  }

  async obtener(usuarioId: string): Promise<Cuenta | null> {
    const u = this.base.usuarios.find((x) => x.id === usuarioId);
    return u ? { usuarioId: u.id, nombre: u.nombre, apodo: u.apodo } : null;
  }
}

export class RepositorioSesionesEnMemoria implements RepositorioSesiones {
  constructor(private readonly base: BaseEnMemoria) {}

  async crear(datos: { usuarioId: string; tokenHash: string; expiraEn: Date }): Promise<void> {
    this.base.sesiones.push({ ...datos, revocadaEn: null });
  }

  async buscarPorTokenHash(tokenHash: string): Promise<SesionGuardada | null> {
    const s = this.base.sesiones.find((x) => x.tokenHash === tokenHash);
    return s ? { usuarioId: s.usuarioId, expiraEn: s.expiraEn, revocadaEn: s.revocadaEn } : null;
  }

  async revocar(tokenHash: string, ahora: Date): Promise<void> {
    for (const s of this.base.sesiones)
      if (s.tokenHash === tokenHash && !s.revocadaEn) s.revocadaEn = ahora;
  }

  async borrarTerminadas(usuarioId: string, ahora: Date): Promise<void> {
    const vigentes = this.base.sesiones.filter(
      (s) => s.usuarioId !== usuarioId || (s.expiraEn > ahora && !s.revocadaEn),
    );
    this.base.sesiones.splice(0, this.base.sesiones.length, ...vigentes);
  }
}

export class RepositorioViajesEnMemoria implements RepositorioViajes, LectorDeViajes {
  constructor(private readonly base: BaseEnMemoria) {}

  async obtenerParaModificar(viajeId: string): Promise<Viaje | null> {
    return this.obtener(viajeId);
  }

  async obtener(viajeId: string): Promise<Viaje | null> {
    const v = this.base.viajes.find((x) => x.id === viajeId);
    return v ? Viaje.reconstruir(structuredClone(v)) : null;
  }

  async guardar(viaje: Viaje): Promise<void> {
    const datos = viaje.aDatos();
    const admins = datos.membresias.filter((m) => m.rol === 'ADMIN' && m.estado === 'ACTIVA');
    if (admins.length > 1) throw new Error('Violación del índice único de Admin activo');
    const i = this.base.viajes.findIndex((x) => x.id === datos.id);
    if (i >= 0) this.base.viajes[i] = datos;
    else this.base.viajes.push(datos);
  }
}

export class ConsultaDeudasEnMemoria implements ConsultaDeudas {
  constructor(private readonly base: BaseEnMemoria) {}

  async totalAdeudado(viajeId: string, usuarioId: string): Promise<number> {
    return this.base.deudas
      .filter((d) => d.viajeId === viajeId && d.deudorId === usuarioId)
      .reduce((total, d) => total + d.monto, 0);
  }
}

export class RetiroDeVotosEnMemoria implements RetiroDeVotos {
  constructor(private readonly base: BaseEnMemoria) {}

  async retirarVotosPendientes(viajeId: string, usuarioId: string): Promise<void> {
    for (const { datos } of this.base.propuestas) {
      if (datos.viajeId === viajeId && datos.estado === 'PENDIENTE') {
        datos.votos = datos.votos.filter((v) => v.usuarioId !== usuarioId);
      }
    }
  }
}

export class ConsultaViajesEnMemoria implements ConsultaViajes {
  constructor(private readonly base: BaseEnMemoria) {}

  private activa(viajeId: string, usuarioId: string) {
    return this.base.viajes
      .find((v) => v.id === viajeId)
      ?.membresias.find((m) => m.usuarioId === usuarioId && m.estado === 'ACTIVA');
  }

  async obtenerAcceso(viajeId: string, usuarioId: string): Promise<Acceso | null> {
    const m = this.activa(viajeId, usuarioId);
    return m ? { rol: m.rol } : null;
  }

  private tieneSaldos(viajeId: string, usuarioId: string): boolean {
    return this.base.deudas.some(
      (d) =>
        d.viajeId === viajeId &&
        d.monto > 0 &&
        (d.deudorId === usuarioId || d.acreedorId === usuarioId),
    );
  }

  async listarDeUsuario(usuarioId: string): Promise<ResumenViaje[]> {
    return this.base.viajes
      .flatMap((v) => {
        const m = v.membresias.find((x) => x.usuarioId === usuarioId);
        const miAcceso = m && tipoDeAcceso(m.estado, this.tieneSaldos(v.id, usuarioId));
        return m && miAcceso
          ? [
              {
                id: v.id,
                nombre: v.nombre,
                destino: v.destino,
                fechaInicio: v.fechaInicio,
                fechaFin: v.fechaFin,
                monedaCodigo: v.monedaCodigo,
                miRol: m.rol,
                miAcceso,
              },
            ]
          : [];
      })
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
  }

  async obtenerDetalle(
    viajeId: string,
    usuarioId: string,
  ): Promise<Omit<DetalleViaje, 'miDeudaPendiente'> | null> {
    const v = this.base.viajes.find((x) => x.id === viajeId);
    const m = v?.membresias.find((x) => x.usuarioId === usuarioId);
    const moneda = this.base.monedas.find((x) => x.codigo === v?.monedaCodigo);
    const miAcceso = m && tipoDeAcceso(m.estado, this.tieneSaldos(viajeId, usuarioId));
    if (!v || !m || !moneda || !miAcceso) return null;
    return {
      id: v.id,
      nombre: v.nombre,
      destino: v.destino,
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      moneda,
      miRol: m.rol,
      miAcceso,
      cantidadParticipantes: v.membresias.filter((x) => x.estado === 'ACTIVA').length,
    };
  }

  async listarParticipantes(viajeId: string): Promise<Participante[]> {
    const v = this.base.viajes.find((x) => x.id === viajeId);
    return (v?.membresias ?? [])
      .filter((m) => m.estado === 'ACTIVA')
      .map((m) => this.participante(m.usuarioId, m.rol))
      .sort(
        (a, b) =>
          Number(b.rol === 'ADMIN') - Number(a.rol === 'ADMIN') || a.nombre.localeCompare(b.nombre),
      );
  }

  async obtenerParticipante(viajeId: string, usuarioId: string): Promise<Participante | null> {
    const m = this.activa(viajeId, usuarioId);
    return m ? this.participante(usuarioId, m.rol) : null;
  }

  async listarMonedas(): Promise<Moneda[]> {
    return [...this.base.monedas].sort((a, b) => a.codigo.localeCompare(b.codigo));
  }

  async existeMoneda(codigo: string): Promise<boolean> {
    return this.base.monedas.some((m) => m.codigo === codigo);
  }

  private participante(usuarioId: string, rol: 'ADMIN' | 'VIAJERO'): Participante {
    const u = this.base.usuarios.find((x) => x.id === usuarioId);
    return { usuarioId, nombre: u?.nombre ?? '', apodo: u?.apodo ?? null, rol };
  }
}

export class BuscadorDeUsuariosEnMemoria implements BuscadorDeUsuarios {
  constructor(private readonly base: BaseEnMemoria) {}

  async buscarPorIdentificador(tipo: 'EMAIL_CONTRASENA', valor: string): Promise<string | null> {
    const identificador = normalizarEmail(valor);
    return (
      this.base.credenciales.find((c) => c.tipo === tipo && c.identificador === identificador)
        ?.usuarioId ?? null
    );
  }
}

export class AgendaDelViajeEnMemoria implements AgendaDelViaje {
  constructor(private readonly base: BaseEnMemoria) {}

  async propuestas(viajeId: string): Promise<PropuestaReacomodable[]> {
    return this.base.propuestas
      .filter((fila) => fila.datos.viajeId === viajeId)
      .flatMap((fila): PropuestaReacomodable[] => {
        const propuesta = Propuesta.reconstruir(structuredClone(fila.datos));
        if (fila.actividad)
          return [Actividad.reconstruir(propuesta, structuredClone(fila.actividad))];
        if (!fila.alojamiento) return [];
        const { nombre, fechaDesde, fechaHasta } = fila.alojamiento;
        return [
          Alojamiento.reconstruir(propuesta, {
            nombre,
            estadia: fechaDesde && fechaHasta ? RangoFechas.crear(fechaDesde, fechaHasta) : null,
            noches: fila.alojamiento.noches ?? 0,
            fechaCambiadaEn: fila.alojamiento.fechaCambiadaEn ?? null,
          }),
        ];
      });
  }

  async guardar(movidas: PropuestaReacomodable[]): Promise<void> {
    for (const p of movidas) {
      const fila = this.base.propuestas.find((f) => f.datos.id === p.id)!;
      if (fila.actividad && p instanceof Actividad) {
        fila.actividad.fecha = p.dias?.desde ?? null;
        fila.actividad.fechaCambiadaEn = p.detalle.fechaCambiadaEn ?? null;
      }
      if (fila.alojamiento && p instanceof Alojamiento) {
        fila.alojamiento.fechaDesde = p.dias?.desde ?? null;
        fila.alojamiento.fechaHasta = p.dias?.hasta ?? null;
        fila.alojamiento.noches = p.noches;
        fila.alojamiento.fechaCambiadaEn = p.fechaCambiadaEn;
      }
    }
  }
}

export function reposViajesEnMemoria(base: BaseEnMemoria): ReposViajes {
  return {
    viajes: new RepositorioViajesEnMemoria(base),
    deudas: new ConsultaDeudasEnMemoria(base),
    votos: new RetiroDeVotosEnMemoria(base),
    agenda: new AgendaDelViajeEnMemoria(base),
  };
}

export class RepositorioPropuestasEnMemoria implements RepositorioPropuestas {
  constructor(private readonly base: BaseEnMemoria) {}

  async obtenerParaModificar(viajeId: string, propuestaId: string): Promise<Propuesta | null> {
    const fila = this.base.propuestas.find(
      (p) => p.datos.id === propuestaId && p.datos.viajeId === viajeId,
    );
    return fila ? Propuesta.reconstruir(structuredClone(fila.datos)) : null;
  }

  async guardar(propuesta: Propuesta): Promise<void> {
    const datos = propuesta.aDatos();
    const fila = this.base.propuestas.find((p) => p.datos.id === datos.id);
    if (fila) fila.datos = datos;
    else this.base.propuestas.push({ datos });
  }
}

function aVistaEnMemoria(
  base: BaseEnMemoria,
  d: DatosPropuesta,
  usuarioId: string,
): PropuestaVista {
  const autor = base.usuarios.find((u) => u.id === d.autorId);
  return {
    id: d.id,
    tipo: d.tipo,
    estado: d.estado,
    descripcion: d.descripcion,
    precio: d.precio,
    ubicacion: d.ubicacion,
    latitud: d.latitud,
    longitud: d.longitud,
    autor: { usuarioId: d.autorId, nombre: autor?.nombre ?? '' },
    votosAFavor: d.votos.filter((v) => v.valor === 'A_FAVOR').length,
    votosEnContra: d.votos.filter((v) => v.valor === 'EN_CONTRA').length,
    miVoto: d.votos.find((v) => v.usuarioId === usuarioId)?.valor ?? null,
    creadaEn: d.creadaEn.toISOString(),
    resueltaEn: d.resueltaEn?.toISOString() ?? null,
  };
}

export class ConsultaPropuestasEnMemoria implements ConsultaPropuestas {
  constructor(private readonly base: BaseEnMemoria) {}

  async obtenerVista(
    viajeId: string,
    propuestaId: string,
    usuarioId: string,
  ): Promise<PropuestaVista | null> {
    const fila = this.base.propuestas.find(
      (p) => p.datos.id === propuestaId && p.datos.viajeId === viajeId,
    );
    return fila ? aVistaEnMemoria(this.base, fila.datos, usuarioId) : null;
  }
}

export class ConsultaOrigenesDePropuestasEnMemoria implements ConsultaOrigenesDePropuestas {
  constructor(private readonly base: BaseEnMemoria) {}

  async origen(propuestaId: string): Promise<OrigenDePropuesta | null> {
    const p = this.base.propuestas.find((x) => x.datos.id === propuestaId)?.datos;
    return p ? { viajeId: p.viajeId, autorId: p.autorId, tipo: p.tipo } : null;
  }
}

export class ConsultaFechasDeViajeEnMemoria implements ConsultaFechasDeViaje {
  constructor(private readonly base: BaseEnMemoria) {}

  async rango(viajeId: string): Promise<RangoFechas | null> {
    const v = this.base.viajes.find((x) => x.id === viajeId);
    return v ? RangoFechas.crear(v.fechaInicio, v.fechaFin) : null;
  }
}

export class RepositorioAlojamientosEnMemoria implements RepositorioAlojamientos {
  constructor(private readonly base: BaseEnMemoria) {}

  async crear(propuesta: Propuesta, detalle: DetalleAlojamiento): Promise<void> {
    this.base.propuestas.push({
      datos: propuesta.aDatos(),
      alojamiento: {
        nombre: detalle.nombre,
        fechaDesde: detalle.estadia?.desde ?? null,
        fechaHasta: detalle.estadia?.hasta ?? null,
        noches: detalle.estadia
          ? diasEntre(detalle.estadia.desde, detalle.estadia.hasta)
          : (detalle.noches ?? 0),
      },
    });
  }
}

export class ConsultaAlojamientosEnMemoria implements ConsultaAlojamientos {
  constructor(private readonly base: BaseEnMemoria) {}

  async listar(
    viajeId: string,
    usuarioId: string,
    estado?: EstadoPropuesta,
  ): Promise<AlojamientoVista[]> {
    return this.base.propuestas
      .filter(
        (p) =>
          p.datos.viajeId === viajeId && p.alojamiento && (!estado || p.datos.estado === estado),
      )
      .sort(
        (a, b) =>
          (a.alojamiento!.fechaDesde ?? '9999').localeCompare(
            b.alojamiento!.fechaDesde ?? '9999',
          ) || a.datos.creadaEn.getTime() - b.datos.creadaEn.getTime(),
      )
      .map((p) => this.vista(p, usuarioId));
  }

  async obtener(
    viajeId: string,
    propuestaId: string,
    usuarioId: string,
  ): Promise<AlojamientoVista | null> {
    const p = this.base.propuestas.find(
      (x) => x.datos.id === propuestaId && x.datos.viajeId === viajeId && x.alojamiento,
    );
    return p ? this.vista(p, usuarioId) : null;
  }

  private vista(p: BaseEnMemoria['propuestas'][number], usuarioId: string): AlojamientoVista {
    return {
      ...aVistaEnMemoria(this.base, p.datos, usuarioId),
      tipo: 'ALOJAMIENTO',
      alojamiento: {
        nombre: p.alojamiento!.nombre,
        fechaDesde: p.alojamiento!.fechaDesde,
        fechaHasta: p.alojamiento!.fechaHasta,
        noches: p.alojamiento!.noches ?? 0,
      },
      fechaCambiadaEn: p.alojamiento!.fechaCambiadaEn?.toISOString() ?? null,
    };
  }
}

type FilaConActividad = BaseEnMemoria['propuestas'][number] & { actividad: DetalleActividad };

const tieneActividad = (p: BaseEnMemoria['propuestas'][number]): p is FilaConActividad =>
  p.actividad !== undefined;

const porHorario = (a: FilaConActividad, b: FilaConActividad) =>
  (a.actividad.fecha ?? '9999').localeCompare(b.actividad.fecha ?? '9999') ||
  a.actividad.horaInicio.localeCompare(b.actividad.horaInicio) ||
  a.datos.creadaEn.getTime() - b.datos.creadaEn.getTime();

export class RepositorioActividadesEnMemoria implements RepositorioActividades {
  constructor(private readonly base: BaseEnMemoria) {}

  async crear(actividad: Actividad): Promise<void> {
    this.base.propuestas.push({
      datos: actividad.propuesta.aDatos(),
      actividad: { ...actividad.detalle },
    });
  }

  async obtenerParaModificar(viajeId: string, actividadId: string): Promise<Actividad | null> {
    const fila = this.base.propuestas
      .filter(tieneActividad)
      .find((p) => p.datos.id === actividadId && p.datos.viajeId === viajeId);
    return fila ? this.reconstruir(fila) : null;
  }

  async confirmadas(viajeId: string): Promise<ActividadAgendada[]> {
    return this.base.propuestas
      .filter(tieneActividad)
      .filter(
        (p) =>
          p.datos.viajeId === viajeId &&
          p.datos.estado === 'CONFIRMADA' &&
          p.actividad?.fecha !== null,
      )
      .sort(porHorario)
      .map(({ datos, actividad: a }) => ({
        id: datos.id,
        titulo: a.titulo,
        fecha: a.fecha!,
        horaInicio: a.horaInicio,
        duracionMin: a.duracionMin,
        intervalo: Intervalo.deActividad(a.fecha!, a.horaInicio, a.duracionMin),
      }));
  }

  async opcionesDelGrupo(viajeId: string, grupoId: string): Promise<Actividad[]> {
    return this.base.propuestas
      .filter(tieneActividad)
      .filter(
        (p) =>
          p.datos.viajeId === viajeId &&
          (p.datos.id === grupoId || p.actividad.alternativaDeId === grupoId),
      )
      .sort((a, b) => a.datos.id.localeCompare(b.datos.id))
      .map((p) => this.reconstruir(p));
  }

  /** Las transacciones en memoria ya se ejecutan de a una. */
  async bloquearAgenda(): Promise<void> {}

  async compartirAgenda(): Promise<void> {}

  private reconstruir(fila: FilaConActividad): Actividad {
    return Actividad.reconstruir(
      Propuesta.reconstruir(structuredClone(fila.datos)),
      structuredClone(fila.actividad),
    );
  }
}

export class ConsultaActividadesEnMemoria implements ConsultaActividades {
  constructor(private readonly base: BaseEnMemoria) {}

  async listar(
    viajeId: string,
    usuarioId: string,
    estado?: EstadoPropuesta,
  ): Promise<ActividadVista[]> {
    return this.base.propuestas
      .filter(tieneActividad)
      .filter((p) => p.datos.viajeId === viajeId && (!estado || p.datos.estado === estado))
      .sort(porHorario)
      .map((p) => this.vista(p, usuarioId));
  }

  async obtener(
    viajeId: string,
    actividadId: string,
    usuarioId: string,
  ): Promise<ActividadVista | null> {
    const p = this.base.propuestas
      .filter(tieneActividad)
      .find((x) => x.datos.id === actividadId && x.datos.viajeId === viajeId);
    return p ? this.vista(p, usuarioId) : null;
  }

  private vista(p: FilaConActividad, usuarioId: string): ActividadVista {
    const a = p.actividad;
    const original = this.base.propuestas.find((x) => x.datos.id === a.alternativaDeId);
    return {
      ...aVistaEnMemoria(this.base, p.datos, usuarioId),
      tipo: 'ACTIVIDAD',
      fechaCambiadaEn: a.fechaCambiadaEn?.toISOString() ?? null,
      actividad: {
        titulo: a.titulo,
        fecha: a.fecha!,
        horaInicio: a.horaInicio,
        horaFin: sumarMinutos(a.horaInicio, a.duracionMin),
        duracionMin: a.duracionMin,
        alternativaDe: original?.actividad
          ? { id: original.datos.id, titulo: original.actividad.titulo }
          : null,
      },
    };
  }
}

export class ConsultaItinerarioEnMemoria implements ConsultaItinerario {
  constructor(private readonly base: BaseEnMemoria) {}

  async actividadesConfirmadas(viajeId: string): Promise<ActividadDelItinerario[]> {
    return this.base.propuestas
      .filter(tieneActividad)
      .filter(
        (p) =>
          p.datos.viajeId === viajeId &&
          p.datos.estado === 'CONFIRMADA' &&
          p.actividad?.fecha !== null,
      )
      .sort(
        (a, b) =>
          (a.actividad.fecha ?? '9999').localeCompare(b.actividad.fecha ?? '9999') ||
          a.actividad.horaInicio.localeCompare(b.actividad.horaInicio) ||
          a.actividad.titulo.localeCompare(b.actividad.titulo),
      )
      .map(({ datos, actividad: a }) => ({
        id: datos.id,
        titulo: a.titulo,
        descripcion: datos.descripcion,
        fecha: a.fecha!,
        horaInicio: a.horaInicio,
        horaFin: sumarMinutos(a.horaInicio, a.duracionMin),
        duracionMin: a.duracionMin,
        ubicacion: datos.ubicacion,
        latitud: datos.latitud ?? 0,
        longitud: datos.longitud ?? 0,
      }));
  }

  async alojamientosConfirmados(viajeId: string): Promise<AlojamientoConfirmado[]> {
    return this.base.propuestas
      .filter((p) => p.datos.viajeId === viajeId && p.datos.estado === 'CONFIRMADA')
      .flatMap((p) =>
        p.alojamiento && p.alojamiento.fechaDesde && p.alojamiento.fechaHasta
          ? [
              {
                id: p.datos.id,
                nombre: p.alojamiento.nombre,
                ubicacion: p.datos.ubicacion,
                estadia: RangoFechas.crear(p.alojamiento.fechaDesde, p.alojamiento.fechaHasta),
              },
            ]
          : [],
      )
      .sort(
        (a, b) =>
          a.estadia.desde.localeCompare(b.estadia.desde) || a.nombre.localeCompare(b.nombre),
      );
  }
}

export class RepositorioMensajesEnMemoria implements RepositorioMensajes {
  constructor(private readonly base: BaseEnMemoria) {}

  async guardar(mensaje: Mensaje): Promise<void> {
    if (this.base.mensajes.some((m) => m.id === mensaje.id)) throw mensajeExistente();
    this.base.mensajes.push(mensaje.aDatos());
  }
}

/** Orden cronológico con desempate por id, como el índice de la base. */
const cronologico = (a: DatosMensaje, b: DatosMensaje) =>
  a.enviadoEn.getTime() - b.enviadoEn.getTime() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export class ConsultaMensajesEnMemoria implements ConsultaMensajes {
  constructor(private readonly base: BaseEnMemoria) {}

  async obtener(viajeId: string, mensajeId: string): Promise<MensajeVista | null> {
    const m = this.base.mensajes.find((x) => x.id === mensajeId && x.viajeId === viajeId);
    return m ? this.vista(m) : null;
  }

  async pagina(
    viajeId: string,
    antesDe: string | undefined,
    limite: number,
  ): Promise<PaginaDeMensajes | null> {
    const delViaje = this.base.mensajes.filter((m) => m.viajeId === viajeId).sort(cronologico);
    let hasta = delViaje.length;
    if (antesDe) {
      hasta = delViaje.findIndex((m) => m.id === antesDe);
      if (hasta < 0) return null;
    }
    const desde = Math.max(0, hasta - limite);
    return { mensajes: delViaje.slice(desde, hasta).map((m) => this.vista(m)), hayMas: desde > 0 };
  }

  private vista(m: DatosMensaje): MensajeVista {
    const u = this.base.usuarios.find((x) => x.id === m.autorId);
    return {
      id: m.id,
      viajeId: m.viajeId,
      autor: { id: m.autorId, nombre: u?.nombre ?? '', apodo: u?.apodo ?? null },
      contenido: m.contenido,
      enviadoEn: m.enviadoEn.toISOString(),
    };
  }
}

export class ConsultaSaldosPendientesEnMemoria implements ConsultaSaldosPendientes {
  constructor(private readonly base: BaseEnMemoria) {}

  async tieneSaldosPendientes(viajeId: string, usuarioId: string): Promise<boolean> {
    return this.base.deudas.some(
      (d) =>
        d.viajeId === viajeId &&
        d.monto > 0 &&
        (d.deudorId === usuarioId || d.acreedorId === usuarioId),
    );
  }
}

/** Evento recibido por una conexión del notificador en memoria. */
export type EventoRecibido =
  | { nombre: 'viaje:membresia-finalizada'; datos: AvisoMembresiaFinalizada }
  | { nombre: 'viaje:admin-cambiado'; datos: AvisoAdminCambiado };

/** Notificador en memoria: cada conexión es una lista de eventos recibidos y un conjunto de salas. */
export class NotificadorViajeEnMemoria implements NotificadorViaje {
  readonly conexiones: { usuarioId: string; salas: Set<string>; recibidos: EventoRecibido[] }[] =
    [];

  conectar(usuarioId: string, viajeId: string): EventoRecibido[] {
    const conexion = { usuarioId, salas: new Set([viajeId]), recibidos: [] as EventoRecibido[] };
    this.conexiones.push(conexion);
    return conexion.recibidos;
  }

  async membresiaFinalizada(usuarioId: string, aviso: AvisoMembresiaFinalizada): Promise<void> {
    for (const c of this.conexiones.filter((x) => x.usuarioId === usuarioId)) {
      c.salas.delete(aviso.viajeId);
      c.recibidos.push({ nombre: 'viaje:membresia-finalizada', datos: aviso });
    }
  }

  async adminCambiado(aviso: AvisoAdminCambiado): Promise<void> {
    for (const c of this.conexiones.filter((x) => x.salas.has(aviso.viajeId))) {
      c.recibidos.push({ nombre: 'viaje:admin-cambiado', datos: aviso });
    }
  }
}

export class RepositorioGastosEnMemoria implements RepositorioGastos {
  constructor(private readonly base: BaseEnMemoria) {}

  async crear(gasto: Gasto): Promise<void> {
    if (this.base.gastos.some((g) => g.id === gasto.id)) throw gastoExistente();
    this.base.gastos.push(gasto.aDatos());
  }
}

export class RepositorioDeudasEnMemoria implements RepositorioDeudas {
  constructor(private readonly base: BaseEnMemoria) {}

  async obtenerParaModificar(
    viajeId: string,
    pares: ParDeViajeros[],
    moneda: string,
  ): Promise<Deuda[]> {
    const todos = pares.flatMap((p) => [p, { deudorId: p.acreedorId, acreedorId: p.deudorId }]);
    return todos
      .map((p) => {
        let fila = this.base.deudas.find(
          (d) =>
            d.viajeId === viajeId && d.deudorId === p.deudorId && d.acreedorId === p.acreedorId,
        );
        if (!fila) {
          fila = { viajeId, ...p, monto: 0 };
          this.base.deudas.push(fila);
        }
        fila.id ??= crypto.randomUUID();
        fila.ultimaActualizacion ??= new Date(0);
        return fila;
      })
      .filter((f, i, lista) => lista.indexOf(f) === i)
      .map((f) =>
        Deuda.reconstruir({
          id: f.id!,
          viajeId,
          deudorId: f.deudorId,
          acreedorId: f.acreedorId,
          monto: Dinero.de(f.monto, moneda),
          ultimaActualizacion: f.ultimaActualizacion!,
        }),
      );
  }

  async obtenerParaPagar(
    viajeId: string,
    par: ParDeViajeros,
    moneda: string,
  ): Promise<Deuda | null> {
    const f = this.base.deudas.find(
      (d) =>
        d.viajeId === viajeId && d.deudorId === par.deudorId && d.acreedorId === par.acreedorId,
    );
    if (!f) return null;
    f.id ??= crypto.randomUUID();
    return Deuda.reconstruir({
      id: f.id,
      viajeId,
      deudorId: f.deudorId,
      acreedorId: f.acreedorId,
      monto: Dinero.de(f.monto, moneda),
      ultimaActualizacion: f.ultimaActualizacion ?? new Date(0),
    });
  }

  async guardar(deudas: Deuda[]): Promise<void> {
    for (const d of deudas) {
      const datos = d.aDatos();
      const fila = this.base.deudas.find((f) => f.id === datos.id)!;
      fila.monto = datos.monto.monto;
      fila.ultimaActualizacion = datos.ultimaActualizacion;
      for (const p of d.pagosSinGuardar()) {
        if (this.base.pagos.some((x) => x.id === p.id)) throw pagoExistente();
        this.base.pagos.push({ ...p, monto: p.monto.monto });
      }
      d.marcarPagosGuardados();
    }
  }
}

export class ConsultaCategoriasEnMemoria implements ConsultaCategorias {
  constructor(private readonly base: BaseEnMemoria) {}

  async listar(): Promise<CategoriaGasto[]> {
    return [...this.base.categorias].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async existe(categoriaId: string): Promise<boolean> {
    return this.base.categorias.some((c) => c.id === categoriaId);
  }
}

export class ConsultaGastosEnMemoria implements ConsultaGastos {
  constructor(private readonly base: BaseEnMemoria) {}

  private persona(id: string) {
    const u = this.base.usuarios.find((x) => x.id === id);
    return { id, nombre: u?.nombre ?? '', apodo: u?.apodo ?? null };
  }

  private vista(g: DatosGasto): GastoVista {
    return {
      id: g.id,
      titulo: g.titulo,
      categoria: this.base.categorias.find((c) => c.id === g.categoriaId)!,
      monto: g.monto.monto,
      modoDivision: g.modoDivision,
      pagadoPor: this.persona(g.pagadoPorId),
      registradoPor: this.persona(g.registradoPorId),
      creadoEn: g.creadoEn.toISOString(),
      partes: g.partes
        .map((p) => ({ usuario: this.persona(p.usuarioId), monto: p.monto.monto }))
        .sort((a, b) => b.monto - a.monto || a.usuario.nombre.localeCompare(b.usuario.nombre)),
    };
  }

  async listar(viajeId: string): Promise<GastoVista[]> {
    return this.base.gastos
      .filter((g) => g.viajeId === viajeId)
      .sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime() || (a.id < b.id ? 1 : -1))
      .map((g) => this.vista(g));
  }

  async obtener(viajeId: string, gastoId: string): Promise<GastoVista | null> {
    const g = this.base.gastos.find((x) => x.id === gastoId && x.viajeId === viajeId);
    return g ? this.vista(g) : null;
  }
}

export class ConsultaSaldosEnMemoria implements ConsultaSaldos {
  constructor(private readonly base: BaseEnMemoria) {}

  private pago(p: BaseEnMemoria['pagos'][number]): PagoRegistrado {
    const u = this.base.usuarios.find((x) => x.id === p.registradoPorId);
    return {
      id: p.id,
      monto: p.monto,
      fecha: p.fecha.toISOString(),
      registradoPor: { id: p.registradoPorId, nombre: u?.nombre ?? '', apodo: u?.apodo ?? null },
    };
  }

  async pagosDe(viajeId: string, usuarioId: string): Promise<PagoDeActividad[]> {
    const persona = (id: string) => {
      const u = this.base.usuarios.find((x) => x.id === id);
      return { id, nombre: u?.nombre ?? '', apodo: u?.apodo ?? null };
    };
    return this.base.pagos
      .flatMap((p) => {
        const d = this.base.deudas.find((x) => x.id === p.deudaId);
        return d?.viajeId === viajeId && [d.deudorId, d.acreedorId].includes(usuarioId)
          ? [{ p, d }]
          : [];
      })
      .sort((a, b) => b.p.fecha.getTime() - a.p.fecha.getTime() || (a.p.id < b.p.id ? 1 : -1))
      .map(({ p, d }) => ({
        id: p.id,
        monto: p.monto,
        fecha: p.fecha.toISOString(),
        deudor: persona(d.deudorId),
        acreedor: persona(d.acreedorId),
      }));
  }

  async obtenerPago(viajeId: string, pagoId: string): Promise<PagoRegistrado | null> {
    const p = this.base.pagos.find((x) => x.id === pagoId);
    const deuda = this.base.deudas.find((d) => d.id === p?.deudaId);
    return p && deuda?.viajeId === viajeId ? this.pago(p) : null;
  }

  async deudas(viajeId: string, usuarioId: string, rol: RolEnDeuda): Promise<DeudaVista[]> {
    return this.base.deudas
      .filter(
        (d) =>
          d.viajeId === viajeId &&
          d.monto > 0 &&
          (rol === 'deudor' ? d.deudorId : d.acreedorId) === usuarioId,
      )
      .sort((a, b) => b.monto - a.monto || ((a.id ?? '') < (b.id ?? '') ? -1 : 1))
      .map((d) => {
        const otro = rol === 'deudor' ? d.acreedorId : d.deudorId;
        const u = this.base.usuarios.find((x) => x.id === otro);
        return {
          id: d.id ?? '',
          contraparte: { id: otro, nombre: u?.nombre ?? '', apodo: u?.apodo ?? null },
          monto: d.monto,
          ultimaActualizacion: (d.ultimaActualizacion ?? new Date(0)).toISOString(),
          pagos: this.base.pagos
            .filter((p) => p.deudaId === d.id)
            .sort((a, b) => b.fecha.getTime() - a.fecha.getTime() || (a.id < b.id ? 1 : -1))
            .map((p) => this.pago(p)),
        };
      });
  }
}

/** Propuesta mínima para cargar en la base en memoria desde las pruebas. */
export function propuestaDePrueba(datos: {
  viajeId: string;
  autorId: string;
  estado?: EstadoPropuesta;
  votantes?: string[];
  id?: string;
}): { datos: DatosPropuesta } {
  return {
    datos: {
      id: datos.id ?? crypto.randomUUID(),
      viajeId: datos.viajeId,
      autorId: datos.autorId,
      tipo: 'ALOJAMIENTO',
      descripcion: 'x',
      precio: null,
      ubicacion: 'y',
      latitud: null,
      longitud: null,
      estado: datos.estado ?? 'PENDIENTE',
      resueltaPorId: null,
      resueltaEn: null,
      creadaEn: new Date(),
      votos: (datos.votantes ?? []).map((usuarioId) => ({
        usuarioId,
        valor: 'A_FAVOR' as const,
        emitidoEn: new Date(),
      })),
    },
  };
}
