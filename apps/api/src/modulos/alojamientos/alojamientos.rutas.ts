import { Router } from 'express';
import { esquemaAlojamientoNuevo, esquemaFiltroEstado } from '@viajes/compartido';
import { ErrorDeDominio } from '../../compartido/errores.js';
import { validar } from '../../middlewares/validar.js';
import type {
  ConsultarAlojamientos,
  ProponerAlojamiento,
} from './casos-de-uso/casosDeUsoAlojamientos.js';

export interface DependenciasRutasAlojamientos {
  proponer: ProponerAlojamiento;
  consultar: ConsultarAlojamientos;
}

/** CU05 y listado de alojamientos (sección 5.5 de PLAN.md). */
export function rutasDeAlojamientos(deps: DependenciasRutasAlojamientos): Router {
  const router = Router({ mergeParams: true });
  const viajeId = (req: { params: Record<string, string | string[] | undefined> }) =>
    String(req.params['viajeId']);

  router.get('/alojamientos', async (req, res) => {
    const filtro = esquemaFiltroEstado.safeParse(req.query);
    if (!filtro.success) throw new ErrorDeDominio('VALIDACION', 'VALIDACION', 'Estado inválido');
    res.json({
      alojamientos: await deps.consultar.listar(
        viajeId(req),
        req.usuarioId ?? '',
        filtro.data.estado,
      ),
    });
  });

  router.post('/alojamientos', validar(esquemaAlojamientoNuevo), async (req, res) => {
    const id = await deps.proponer.ejecutar(viajeId(req), req.usuarioId ?? '', req.body);
    res
      .status(201)
      .json({ alojamiento: await deps.consultar.obtener(viajeId(req), id, req.usuarioId ?? '') });
  });

  return router;
}
