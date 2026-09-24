import { Router } from 'express';
import { esquemaConsultaMapa } from '@viajes/compartido';
import { ErrorDeDominio } from '../../compartido/errores.js';
import type { ConsultarCronograma, ConsultarMapa } from './casos-de-uso/casosDeUsoItinerario.js';

export interface DependenciasRutasItinerario {
  cronograma: ConsultarCronograma;
  mapa: ConsultarMapa;
}

/** CU16 y CU17 (sección 5.7 de PLAN.md). */
export function rutasDeItinerario(deps: DependenciasRutasItinerario): Router {
  const router = Router({ mergeParams: true });
  const viajeId = (req: { params: Record<string, string | string[] | undefined> }) =>
    String(req.params['viajeId']);

  router.get('/cronograma', async (req, res) => {
    res.json(await deps.cronograma.ejecutar(viajeId(req)));
  });

  router.get('/mapa', async (req, res) => {
    const consulta = esquemaConsultaMapa.safeParse(req.query);
    if (!consulta.success) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'VALIDACION',
        'Parámetros inválidos',
        consulta.error.issues.map((i) => ({ campo: String(i.path[0]), mensaje: i.message })),
      );
    }
    res.json(await deps.mapa.ejecutar(viajeId(req), consulta.data.hoy, consulta.data.dia));
  });

  return router;
}
