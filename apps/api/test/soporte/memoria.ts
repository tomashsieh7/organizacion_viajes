/**
 * Implementaciones en memoria de los puertos de F2, para las pruebas unitarias. Todas trabajan
 * sobre una misma `BaseEnMemoria`, así se comportan como tablas de una misma base. Las pruebas de
 * contrato verifican que se comporten igual que las implementaciones con Prisma.
 */
import type { DetalleViaje, Moneda, Participante, ResumenViaje } from '@viajes/compartido';
import { ErrorDeDominio } from '../../src/compartido/errores.js';
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
  BuscadorDeUsuarios,
  ConsultaDeudas,
  ConsultaViajes,
  ReposViajes,
  RepositorioViajes,
  RetiroDeVotos,
} from '../../src/modulos/viajes/dominio/puertos.js';
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
  deudas: { viajeId: string; deudorId: string; acreedorId: string; monto: number }[];
  votos: { propuestaId: string; usuarioId: string; viajeId: string; pendiente: boolean }[];
}

export function baseVacia(): BaseEnMemoria {
  return {
    usuarios: [],
    credenciales: [],
    sesiones: [],
    monedas: [{ codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 }],
    viajes: [],
    deudas: [],
    votos: [],
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
}

export class RepositorioViajesEnMemoria implements RepositorioViajes {
  constructor(private readonly base: BaseEnMemoria) {}

  async obtenerParaModificar(viajeId: string): Promise<Viaje | null> {
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
    this.base.votos = this.base.votos.filter(
      (v) => !(v.viajeId === viajeId && v.usuarioId === usuarioId && v.pendiente),
    );
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

  async listarDeUsuario(usuarioId: string): Promise<ResumenViaje[]> {
    return this.base.viajes
      .flatMap((v) => {
        const m = v.membresias.find((x) => x.usuarioId === usuarioId && x.estado === 'ACTIVA');
        return m
          ? [
              {
                id: v.id,
                nombre: v.nombre,
                destino: v.destino,
                fechaInicio: v.fechaInicio,
                fechaFin: v.fechaFin,
                monedaCodigo: v.monedaCodigo,
                miRol: m.rol,
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
    const m = this.activa(viajeId, usuarioId);
    const moneda = this.base.monedas.find((x) => x.codigo === v?.monedaCodigo);
    if (!v || !m || !moneda) return null;
    return {
      id: v.id,
      nombre: v.nombre,
      destino: v.destino,
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      moneda,
      miRol: m.rol,
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

export function reposViajesEnMemoria(base: BaseEnMemoria): ReposViajes {
  return {
    viajes: new RepositorioViajesEnMemoria(base),
    deudas: new ConsultaDeudasEnMemoria(base),
    votos: new RetiroDeVotosEnMemoria(base),
  };
}
