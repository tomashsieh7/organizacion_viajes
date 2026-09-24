import { Router } from 'express';
import { esquemaConsultaMensajes } from '@viajes/compartido';
import { ErrorDeDominio } from '../../compartido/errores.js';
import type { ConsultarMensajes } from './casos-de-uso/casosDeUsoChat.js';

/** CU19: historial del chat (sección 5.8 de PLAN.md); los mensajes nuevos van por Socket.IO. */
export function rutasDeChat(consultar: ConsultarMensajes): Router {
  const router = Router({ mergeParams: true });
  const viajeId = (req: { params: Record<string, string | string[] | undefined> }) =>
    String(req.params['viajeId']);

  router.get('/mensajes', async (req, res) => {
    const consulta = esquemaConsultaMensajes.safeParse(req.query);
    if (!consulta.success) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'VALIDACION',
        'Parámetros inválidos',
        consulta.error.issues.map((i) => ({ campo: String(i.path[0]), mensaje: i.message })),
      );
    }
    const { antesDe, limite } = consulta.data;
    res.json(await consultar.pagina(viajeId(req), antesDe, limite));
  });

  return router;
}
