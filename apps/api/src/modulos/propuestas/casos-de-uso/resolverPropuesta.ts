import type { AccionSobrePropuesta, RespuestaResolucion } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { Reloj } from '../../../comun/reloj.js';
import type { UnidadDeTrabajo } from '../../../comun/unidadDeTrabajo.js';
import type { ConsultaPropuestas, ReglaAlResolver, ReposPropuestas } from '../dominio/puertos.js';
import { cargar, noEncontrada, vista } from './verificaciones.js';

/** RN-X2: dentro de la transacción, quien resuelve tiene que seguir siendo el Admin. */
async function exigirAdmin(repos: ReposPropuestas, viajeId: string, usuarioId: string) {
  const viaje = await repos.viajes.obtener(viajeId);
  if (!viaje) throw noEncontrada();
  if (!viaje.esAdmin(usuarioId)) {
    throw new ErrorDeDominio('PROHIBIDO', 'SOLO_ADMIN', 'Solo el Admin del viaje puede hacer esto');
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
      await exigirAdmin(repos, viajeId, adminId);
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
