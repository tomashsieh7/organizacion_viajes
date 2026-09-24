import { randomUUID } from 'node:crypto';
import type {
  DatosViajeNuevo,
  DetalleViaje,
  Moneda,
  Participante,
  ResumenViaje,
} from '@viajes/compartido';
import { ErrorDeDominio } from '../../../compartido/errores.js';
import type { PublicadorDeEventos } from '../../../compartido/eventos.js';
import type { Reloj } from '../../../compartido/reloj.js';
import type { UnidadDeTrabajo } from '../../../compartido/unidadDeTrabajo.js';
import type { EventoDeViaje } from '../dominio/eventos.js';
import type {
  BuscadorDeUsuarios,
  ConsultaDeudas,
  ConsultaViajes,
  ReposViajes,
} from '../dominio/puertos.js';
import { Viaje } from '../dominio/viaje.js';

const noEncontrado = () =>
  new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El viaje no existe');

/** Dependencias comunes de los casos de uso que modifican un viaje. */
export interface DependenciasViajes {
  unidad: UnidadDeTrabajo<ReposViajes>;
  eventos: PublicadorDeEventos;
  reloj: Reloj;
}

/**
 * Carga el viaje bloqueado, aplica el cambio y lo guarda en una transacción; al confirmar,
 * publica los eventos de dominio que el cambio produjo.
 */
async function modificarViaje<T>(
  deps: DependenciasViajes,
  viajeId: string,
  cambio: (viaje: Viaje, repos: ReposViajes) => Promise<T>,
): Promise<T> {
  const { resultado, eventos } = await deps.unidad.ejecutar(async (repos) => {
    const viaje = await repos.viajes.obtenerParaModificar(viajeId);
    if (!viaje) throw noEncontrado();
    const resultado = await cambio(viaje, repos);
    await repos.viajes.guardar(viaje);
    return { resultado, eventos: viaje.extraerEventos() };
  });
  for (const evento of eventos as EventoDeViaje[]) await deps.eventos.publicar(evento);
  return resultado;
}

/** CU01. */
export class CrearViaje {
  constructor(
    private readonly deps: DependenciasViajes,
    private readonly consultas: ConsultaViajes,
  ) {}

  async ejecutar(creadorId: string, datos: DatosViajeNuevo): Promise<string> {
    if (!(await this.consultas.existeMoneda(datos.monedaCodigo))) {
      throw new ErrorDeDominio(
        'REGLA_DE_NEGOCIO',
        'MONEDA_INEXISTENTE',
        'La moneda elegida no existe',
      );
    }
    const viaje = Viaje.crear({
      id: randomUUID(),
      nombre: datos.nombre,
      destino: datos.destino,
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin,
      monedaCodigo: datos.monedaCodigo,
      creadorId,
      ahora: this.deps.reloj.ahora(),
    });
    await this.deps.unidad.ejecutar((repos) => repos.viajes.guardar(viaje));
    return viaje.id;
  }
}

/** CU02. */
export class AgregarViajero {
  constructor(
    private readonly deps: DependenciasViajes,
    private readonly buscador: BuscadorDeUsuarios,
  ) {}

  async ejecutar(viajeId: string, solicitanteId: string, email: string): Promise<string> {
    const usuarioId = await this.buscador.buscarPorIdentificador('EMAIL_CONTRASENA', email);
    if (!usuarioId) {
      throw new ErrorDeDominio(
        'NO_ENCONTRADO',
        'USUARIO_NO_REGISTRADO',
        'No hay ningún usuario registrado con ese email',
      );
    }
    await modificarViaje(this.deps, viajeId, async (viaje) => {
      viaje.agregarViajero(solicitanteId, usuarioId, this.deps.reloj.ahora());
    });
    return usuarioId;
  }
}

/** CU03. */
export class EliminarParticipante {
  constructor(private readonly deps: DependenciasViajes) {}

  ejecutar(viajeId: string, solicitanteId: string, usuarioId: string): Promise<boolean> {
    return modificarViaje(this.deps, viajeId, async (viaje, repos) => {
      const tieneDeuda = (await repos.deudas.totalAdeudado(viajeId, usuarioId)) > 0;
      viaje.eliminarParticipante(solicitanteId, usuarioId, tieneDeuda, this.deps.reloj.ahora());
      await repos.votos.retirarVotosPendientes(viajeId, usuarioId);
      return tieneDeuda;
    });
  }
}

/** CU04. */
export class SalirDelViaje {
  constructor(private readonly deps: DependenciasViajes) {}

  ejecutar(viajeId: string, usuarioId: string, nuevoAdminId?: string): Promise<boolean> {
    return modificarViaje(this.deps, viajeId, async (viaje, repos) => {
      const tieneDeuda = (await repos.deudas.totalAdeudado(viajeId, usuarioId)) > 0;
      viaje.salir(usuarioId, nuevoAdminId, tieneDeuda, this.deps.reloj.ahora());
      await repos.votos.retirarVotosPendientes(viajeId, usuarioId);
      return tieneDeuda;
    });
  }
}

/** CU24. */
export class TransferirAdministracion {
  constructor(private readonly deps: DependenciasViajes) {}

  async ejecutar(viajeId: string, solicitanteId: string, nuevoAdminId: string): Promise<void> {
    await modificarViaje(this.deps, viajeId, async (viaje) => {
      viaje.transferirAdministracion(solicitanteId, nuevoAdminId);
    });
  }
}

/** Lecturas de viajes, participantes y monedas. */
export class ConsultarViajes {
  constructor(
    private readonly consultas: ConsultaViajes,
    private readonly deudas: ConsultaDeudas,
  ) {}

  listarMisViajes(usuarioId: string): Promise<ResumenViaje[]> {
    return this.consultas.listarDeUsuario(usuarioId);
  }

  async detalle(viajeId: string, usuarioId: string): Promise<DetalleViaje> {
    const detalle = await this.consultas.obtenerDetalle(viajeId, usuarioId);
    if (!detalle) throw noEncontrado();
    return { ...detalle, miDeudaPendiente: await this.deudas.totalAdeudado(viajeId, usuarioId) };
  }

  participantes(viajeId: string): Promise<Participante[]> {
    return this.consultas.listarParticipantes(viajeId);
  }

  async participante(viajeId: string, usuarioId: string): Promise<Participante> {
    const p = await this.consultas.obtenerParticipante(viajeId, usuarioId);
    if (!p)
      throw new ErrorDeDominio(
        'NO_ENCONTRADO',
        'NO_ENCONTRADO',
        'Esa persona no participa del viaje',
      );
    return p;
  }

  monedas(): Promise<Moneda[]> {
    return this.consultas.listarMonedas();
  }
}
