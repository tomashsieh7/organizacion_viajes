import { Router } from 'express';
import { esquemaVoto, type AccionSobrePropuesta } from '@viajes/compartido';
import { parametroUuid, soloAdmin } from '../../middlewares/acceso.js';
import { validar } from '../../middlewares/validar.js';
import type { ResolverPropuesta, Votar } from './casos-de-uso/casosDeUsoPropuestas.js';
import type { ReposPropuestas } from './dominio/puertos.js';

export interface DependenciasRutasPropuestas {
  votar: Pick<Votar<ReposPropuestas>, 'votar' | 'desvotar'>;
  /** Genérico sobre los repositorios de la transacción: las reglas de cada tipo los amplían. */
  resolver: Pick<ResolverPropuesta<ReposPropuestas>, 'ejecutar'>;
}

const ACCIONES: AccionSobrePropuesta[] = ['confirmar', 'denegar', 'cancelar'];

/** Votos y resolución comunes a alojamientos y actividades (sección 5.4 de PLAN.md). */
export function rutasDePropuestas(deps: DependenciasRutasPropuestas): Router {
  const router = Router({ mergeParams: true });
  const ids = (req: {
    params: Record<string, string | string[] | undefined>;
    usuarioId?: string;
  }) =>
    [
      String(req.params['viajeId']),
      String(req.params['propuestaId']),
      req.usuarioId ?? '',
    ] as const;

  router.use('/propuestas/:propuestaId', parametroUuid('propuestaId'));

  router.put('/propuestas/:propuestaId/voto', validar(esquemaVoto), async (req, res) => {
    const [viajeId, propuestaId, usuarioId] = ids(req);
    res.json({
      propuesta: await deps.votar.votar(viajeId, propuestaId, usuarioId, req.body.valor),
    });
  });

  router.delete('/propuestas/:propuestaId/voto', async (req, res) => {
    const [viajeId, propuestaId, usuarioId] = ids(req);
    res.json({ propuesta: await deps.votar.desvotar(viajeId, propuestaId, usuarioId) });
  });

  for (const accion of ACCIONES) {
    router.post(`/propuestas/:propuestaId/${accion}`, soloAdmin, async (req, res) => {
      const [viajeId, propuestaId, usuarioId] = ids(req);
      res.json(await deps.resolver.ejecutar(viajeId, propuestaId, accion, usuarioId));
    });
  }

  return router;
}
