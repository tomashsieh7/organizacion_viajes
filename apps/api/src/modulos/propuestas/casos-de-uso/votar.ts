import type { PropuestaVista, ValorVoto } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { Reloj } from '../../../comun/reloj.js';
import type { UnidadDeTrabajo } from '../../../comun/unidadDeTrabajo.js';
import type { ConsultaPropuestas, ReposPropuestas } from '../dominio/puertos.js';
import { cargar, noEncontrada, vista } from './verificaciones.js';

/** RN-X1 y RN-E5: dentro de la transacción, quien vota tiene que seguir participando. */
async function exigirParticipante(repos: ReposPropuestas, viajeId: string, usuarioId: string) {
  const viaje = await repos.viajes.obtener(viajeId);
  if (!viaje) throw noEncontrada();
  if (!viaje.esParticipanteActivo(usuarioId)) {
    throw new ErrorDeDominio('PROHIBIDO', 'NO_PARTICIPANTE', 'No participás de este viaje');
  }
}

/** CU06, CU12 y CU25/CU26: votar y desvotar. */
export class Votar {
  constructor(
    private readonly unidad: UnidadDeTrabajo<ReposPropuestas>,
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
      await exigirParticipante(repos, viajeId, usuarioId);
      const p = await cargar(repos, viajeId, propuestaId);
      p.votar(usuarioId, valor, this.reloj.ahora());
      await repos.propuestas.guardar(p);
    });
    return vista(this.consultas, viajeId, propuestaId, usuarioId);
  }

  async desvotar(viajeId: string, propuestaId: string, usuarioId: string): Promise<PropuestaVista> {
    await this.unidad.ejecutar(async (repos) => {
      await exigirParticipante(repos, viajeId, usuarioId);
      const p = await cargar(repos, viajeId, propuestaId);
      p.desvotar(usuarioId);
      await repos.propuestas.guardar(p);
    });
    return vista(this.consultas, viajeId, propuestaId, usuarioId);
  }
}
