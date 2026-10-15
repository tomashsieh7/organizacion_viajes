import { Router } from 'express';
import { esquemaConsultaMensajes } from '@viajes/compartido';
import { ErrorDeDominio } from '../../compartido/errores.js';
import type { ConsultarMensajes, MarcarChatLeido } from './casos-de-uso/casosDeUsoChat.js';

export interface DependenciasRutasChat {
  consultar: ConsultarMensajes;
  marcarLeido: MarcarChatLeido;
}

/**
 * CU19: historial del chat y marca de lectura (sección 5.8 de PLAN.md); los mensajes nuevos, las
 * reacciones y el aviso de escribiendo van por Socket.IO.
 */
export function rutasDeChat({ consultar, marcarLeido }: DependenciasRutasChat): Router {
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

  router.put('/mensajes/leidos', async (req, res) => {
    await marcarLeido.ejecutar(viajeId(req), req.usuarioId ?? '');
    res.status(204).end();
  });

  return router;
}
