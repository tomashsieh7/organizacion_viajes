import { ErrorDeDominio } from '../../../compartido/errores.js';
import type { Fecha } from '../../../compartido/valores/fecha.js';
import { RangoFechas } from '../../../compartido/valores/rangoFechas.js';
import type { EventoDeViaje } from './eventos.js';

export type Rol = 'ADMIN' | 'VIAJERO';
export type EstadoMembresia = 'ACTIVA' | 'ELIMINADA' | 'RETIRADA';

export interface DatosMembresia {
  usuarioId: string;
  rol: Rol;
  estado: EstadoMembresia;
  bajaConDeuda: boolean;
  altaEn: Date;
  bajaEn: Date | null;
}

export interface DatosViaje {
  id: string;
  nombre: string;
  destino: string;
  fechaInicio: Fecha;
  fechaFin: Fecha;
  monedaCodigo: string;
  creadoPorId: string;
  creadoEn: Date;
  membresias: DatosMembresia[];
}

/** Pertenencia de un usuario a un viaje, con su rol y su estado (P2, P18). */
export class Membresia {
  constructor(private datos: DatosMembresia) {}

  get usuarioId() {
    return this.datos.usuarioId;
  }
  get rol() {
    return this.datos.rol;
  }
  get estado() {
    return this.datos.estado;
  }

  estaActiva(): boolean {
    return this.datos.estado === 'ACTIVA';
  }

  esAdminActivo(): boolean {
    return this.estaActiva() && this.datos.rol === 'ADMIN';
  }

  /** RN-E3, RN-E4, RN-E7: baja lógica que nunca borra historial y registra si había deuda. */
  darDeBaja(estado: 'ELIMINADA' | 'RETIRADA', conDeuda: boolean, ahora: Date): void {
    this.datos = { ...this.datos, rol: 'VIAJERO', estado, bajaConDeuda: conDeuda, bajaEn: ahora };
  }

  /** RN-E8: volver a agregar a alguien reactiva su misma membresía. */
  reactivar(): void {
    this.datos = {
      ...this.datos,
      rol: 'VIAJERO',
      estado: 'ACTIVA',
      bajaConDeuda: false,
      bajaEn: null,
    };
  }

  cambiarRol(rol: Rol): void {
    this.datos = { ...this.datos, rol };
  }

  aDatos(): DatosMembresia {
    return { ...this.datos };
  }
}

const soloAdmin = () =>
  new ErrorDeDominio('PROHIBIDO', 'SOLO_ADMIN', 'Solo el Admin del viaje puede hacer esto');

/**
 * Agregado Viaje: es el experto en quiénes participan y quién administra (GRASP). Registra los
 * eventos de dominio que producen sus cambios para que el caso de uso los publique al confirmar.
 */
export class Viaje {
  private readonly membresias: Membresia[];
  private eventos: EventoDeViaje[] = [];

  private constructor(
    private readonly datos: Omit<DatosViaje, 'membresias'>,
    membresias: DatosMembresia[],
  ) {
    this.membresias = membresias.map((m) => new Membresia(m));
  }

  /** RN-T1: quien crea el viaje queda como su único Admin. */
  static crear(datos: {
    id: string;
    nombre: string;
    destino: string;
    fechaInicio: string;
    fechaFin: string;
    monedaCodigo: string;
    creadorId: string;
    ahora: Date;
  }): Viaje {
    const rango = RangoFechas.crear(datos.fechaInicio, datos.fechaFin);
    return new Viaje(
      {
        id: datos.id,
        nombre: datos.nombre,
        destino: datos.destino,
        fechaInicio: rango.desde,
        fechaFin: rango.hasta,
        monedaCodigo: datos.monedaCodigo,
        creadoPorId: datos.creadorId,
        creadoEn: datos.ahora,
      },
      [
        {
          usuarioId: datos.creadorId,
          rol: 'ADMIN',
          estado: 'ACTIVA',
          bajaConDeuda: false,
          altaEn: datos.ahora,
          bajaEn: null,
        },
      ],
    );
  }

  static reconstruir(datos: DatosViaje): Viaje {
    const { membresias, ...resto } = datos;
    return new Viaje(resto, membresias);
  }

  get id() {
    return this.datos.id;
  }

  get rango(): RangoFechas {
    return RangoFechas.crear(this.datos.fechaInicio, this.datos.fechaFin);
  }

  /**
   * RN-M1 (P19): el día que muestra el mapa si no se eligió otro. Hoy, si cae dentro del viaje
   * aunque no tenga actividades; si no, el primer día con actividades confirmadas; y si no hay
   * ninguna, el primer día del viaje.
   */
  diaInicialDelMapa(hoy: Fecha, diasConActividad: Fecha[]): Fecha {
    const rango = this.rango;
    if (rango.contiene(hoy)) return hoy;
    const conActividad = diasConActividad.filter((d) => rango.contiene(d)).sort();
    return conActividad[0] ?? rango.desde;
  }

  membresiaDe(usuarioId: string): Membresia | undefined {
    return this.membresias.find((m) => m.usuarioId === usuarioId);
  }

  esParticipanteActivo(usuarioId: string): boolean {
    return this.membresiaDe(usuarioId)?.estaActiva() ?? false;
  }

  esAdmin(usuarioId: string): boolean {
    return this.membresiaDe(usuarioId)?.esAdminActivo() ?? false;
  }

  participantesActivos(): Membresia[] {
    return this.membresias.filter((m) => m.estaActiva());
  }

  /** CU02, RN-X2, RN-E8. */
  agregarViajero(solicitanteId: string, usuarioId: string, ahora: Date): void {
    this.exigirAdmin(solicitanteId);
    const existente = this.membresiaDe(usuarioId);
    if (existente?.estaActiva()) {
      throw new ErrorDeDominio(
        'CONFLICTO',
        'YA_ES_PARTICIPANTE',
        'Esa persona ya participa del viaje',
      );
    }
    if (existente) {
      existente.reactivar();
      return;
    }
    this.membresias.push(
      new Membresia({
        usuarioId,
        rol: 'VIAJERO',
        estado: 'ACTIVA',
        bajaConDeuda: false,
        altaEn: ahora,
        bajaEn: null,
      }),
    );
  }

  /** CU03, RN-E1 a RN-E4. */
  eliminarParticipante(
    solicitanteId: string,
    usuarioId: string,
    tieneDeuda: boolean,
    ahora: Date,
  ): void {
    this.exigirAdmin(solicitanteId);
    if (solicitanteId === usuarioId) {
      throw new ErrorDeDominio(
        'CONFLICTO',
        'NO_PUEDE_ELIMINARSE_A_SI_MISMO',
        'El Admin no puede eliminarse; puede transferir la administración y salir del grupo',
      );
    }
    const membresia = this.exigirParticipanteActivo(usuarioId);
    membresia.darDeBaja('ELIMINADA', tieneDeuda, ahora);
    this.eventos.push({
      tipo: 'viaje.miembro-dado-de-baja',
      viajeId: this.id,
      usuarioId,
      motivo: 'ELIMINADO',
      bajaConDeuda: tieneDeuda,
    });
  }

  /** CU24, RN-T2: en una misma operación el elegido pasa a Admin y el anterior a viajero. */
  transferirAdministracion(solicitanteId: string, sucesorId: string): void {
    this.exigirAdmin(solicitanteId);
    if (sucesorId === solicitanteId || !this.esParticipanteActivo(sucesorId)) {
      throw new ErrorDeDominio(
        'REGLA_DE_NEGOCIO',
        'SUCESOR_INVALIDO',
        'El nuevo Admin tiene que ser otro participante activo del viaje',
      );
    }
    this.exigirParticipanteActivo(solicitanteId).cambiarRol('VIAJERO');
    this.exigirParticipanteActivo(sucesorId).cambiarRol('ADMIN');
    this.eventos.push({
      tipo: 'viaje.administracion-transferida',
      viajeId: this.id,
      anteriorAdminId: solicitanteId,
      nuevoAdminId: sucesorId,
    });
  }

  /** CU04, RN-T3, RN-T4, RN-E7. */
  salir(usuarioId: string, sucesorId: string | undefined, tieneDeuda: boolean, ahora: Date): void {
    const membresia = this.exigirParticipanteActivo(usuarioId);
    if (membresia.esAdminActivo()) {
      if (this.participantesActivos().length === 1) {
        throw new ErrorDeDominio(
          'CONFLICTO',
          'ADMIN_UNICO_PARTICIPANTE',
          'No podés salir: no hay otro participante a quien transferir la administración',
        );
      }
      if (!sucesorId) {
        throw new ErrorDeDominio(
          'VALIDACION',
          'FALTA_SUCESOR',
          'Antes de salir tenés que elegir quién va a ser el nuevo Admin',
        );
      }
      this.transferirAdministracion(usuarioId, sucesorId);
    }
    membresia.darDeBaja('RETIRADA', tieneDeuda, ahora);
    this.eventos.push({
      tipo: 'viaje.miembro-dado-de-baja',
      viajeId: this.id,
      usuarioId,
      motivo: 'RETIRADO',
      bajaConDeuda: tieneDeuda,
    });
  }

  /** Devuelve y vacía los eventos pendientes de publicar. */
  extraerEventos(): EventoDeViaje[] {
    const eventos = this.eventos;
    this.eventos = [];
    return eventos;
  }

  aDatos(): DatosViaje {
    return { ...this.datos, membresias: this.membresias.map((m) => m.aDatos()) };
  }

  private exigirAdmin(usuarioId: string): void {
    if (!this.esAdmin(usuarioId)) throw soloAdmin();
  }

  private exigirParticipanteActivo(usuarioId: string): Membresia {
    const membresia = this.membresiaDe(usuarioId);
    if (!membresia?.estaActiva()) {
      throw new ErrorDeDominio(
        'NO_ENCONTRADO',
        'NO_ENCONTRADO',
        'Esa persona no participa del viaje',
      );
    }
    return membresia;
  }
}
