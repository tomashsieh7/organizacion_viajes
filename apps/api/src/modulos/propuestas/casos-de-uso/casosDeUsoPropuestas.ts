import type {
  AccionSobrePropuesta,
  PropuestaVista,
  RespuestaResolucion,
  ValorVoto,
} from '@viajes/compartido';
import { ErrorDeDominio } from '../../../compartido/errores.js';
import type { Reloj } from '../../../compartido/reloj.js';
import type { UnidadDeTrabajo } from '../../../compartido/unidadDeTrabajo.js';
import type { Propuesta } from '../dominio/propuesta.js';
import type { ConsultaPropuestas, ReglaAlResolver, ReposPropuestas } from '../dominio/puertos.js';

const noEncontrada = () =>
  new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'La propuesta no existe');

async function cargar<R extends ReposPropuestas>(
  repos: R,
  viajeId: string,
  propuestaId: string,
): Promise<Propuesta> {
  const propuesta = await repos.propuestas.obtenerParaModificar(viajeId, propuestaId);
  if (!propuesta) throw noEncontrada();
  return propuesta;
}

async function vista(
  consultas: ConsultaPropuestas,
  viajeId: string,
  propuestaId: string,
  usuarioId: string,
) {
  const v = await consultas.obtenerVista(viajeId, propuestaId, usuarioId);
  if (!v) throw noEncontrada();
  return v;
}

/** CU06, CU12 y CU25/CU26: votar y desvotar. */
export class Votar<R extends ReposPropuestas> {
  constructor(
    private readonly unidad: UnidadDeTrabajo<R>,
    private readonly consultas: ConsultaPropuestas,
    private readonly reloj: Reloj,
  ) {}

  async votar(
    viajeId: string,
    propuestaId: string,
    usuarioId: string,
    valor: ValorVoto,
  ): Promise<PropuestaVista> {
    await this.unidad.ejecutar(async (repos) => {
      const p = await cargar(repos, viajeId, propuestaId);
      p.votar(usuarioId, valor, this.reloj.ahora());
      await repos.propuestas.guardar(p);
    });
    return vista(this.consultas, viajeId, propuestaId, usuarioId);
  }

  async desvotar(viajeId: string, propuestaId: string, usuarioId: string): Promise<PropuestaVista> {
    await this.unidad.ejecutar(async (repos) => {
      const p = await cargar(repos, viajeId, propuestaId);
      p.desvotar(usuarioId);
      await repos.propuestas.guardar(p);
    });
    return vista(this.consultas, viajeId, propuestaId, usuarioId);
  }
}

/**
 * CU07 a CU09 y CU13 a CU15: el Admin confirma, deniega o cancela. Las reglas propias de cada tipo
 * se inyectan desde el punto de composición sin modificar este caso de uso.
 */
export class ResolverPropuesta<R extends ReposPropuestas> {
  constructor(
    private readonly unidad: UnidadDeTrabajo<R>,
    private readonly consultas: ConsultaPropuestas,
    private readonly reloj: Reloj,
    private readonly reglas: ReglaAlResolver<R>[] = [],
  ) {}

  async ejecutar(
    viajeId: string,
    propuestaId: string,
    accion: AccionSobrePropuesta,
    adminId: string,
  ): Promise<RespuestaResolucion> {
    const afectadas = await this.unidad.ejecutar(async (repos) => {
      const propuesta = await cargar(repos, viajeId, propuestaId);
      const ahora = this.reloj.ahora();
      propuesta.resolver(accion, adminId, ahora);
      const otras: string[] = [];
      for (const regla of this.reglas) {
        otras.push(...(await regla.alResolver({ propuesta, accion, adminId, ahora, repos })));
      }
      await repos.propuestas.guardar(propuesta);
      return otras;
    });
    return { propuesta: await vista(this.consultas, viajeId, propuestaId, adminId), afectadas };
  }
}
