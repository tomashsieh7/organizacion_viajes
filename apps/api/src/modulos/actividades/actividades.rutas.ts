import { Router } from 'express';
import { esquemaActividadNueva, esquemaFiltroEstado } from '@viajes/compartido';
import { ErrorDeDominio } from '../../compartido/errores.js';
import { parametroUuid } from '../../middlewares/acceso.js';
import { validar } from '../../middlewares/validar.js';
import type {
  ConsultarActividades,
  ProponerActividad,
  ProponerAlternativa,
} from './casos-de-uso/casosDeUsoActividades.js';

export interface DependenciasRutasActividades {
  proponer: ProponerActividad;
  proponerAlternativa: ProponerAlternativa;
  consultar: ConsultarActividades;
}

/** CU10, CU11, CU18 y listado de actividades (sección 5.6 de PLAN.md). */
export function rutasDeActividades(deps: DependenciasRutasActividades): Router {
  const router = Router({ mergeParams: true });
  const p = (req: { params: Record<string, string | string[] | undefined> }, nombre: string) =>
    String(req.params[nombre]);

  router.get('/actividades', async (req, res) => {
    const filtro = esquemaFiltroEstado.safeParse(req.query);
    if (!filtro.success) throw new ErrorDeDominio('VALIDACION', 'VALIDACION', 'Estado inválido');
    res.json({
      actividades: await deps.consultar.listar(
        p(req, 'viajeId'),
        req.usuarioId ?? '',
        filtro.data.estado,
      ),
    });
  });

  router.post('/actividades', validar(esquemaActividadNueva), async (req, res) => {
    const id = await deps.proponer.ejecutar(p(req, 'viajeId'), req.usuarioId ?? '', req.body);
    res.status(201).json({
      actividad: await deps.consultar.obtener(p(req, 'viajeId'), id, req.usuarioId ?? ''),
    });
  });

  router.use('/actividades/:actividadId', parametroUuid('actividadId'));

  router.get('/actividades/:actividadId', async (req, res) => {
    res.json({
      actividad: await deps.consultar.obtener(
        p(req, 'viajeId'),
        p(req, 'actividadId'),
        req.usuarioId ?? '',
      ),
    });
  });

  router.post(
    '/actividades/:actividadId/alternativas',
    validar(esquemaActividadNueva),
    async (req, res) => {
      const id = await deps.proponerAlternativa.ejecutar(
        p(req, 'viajeId'),
        p(req, 'actividadId'),
        req.usuarioId ?? '',
        req.body,
      );
      res.status(201).json({
        actividad: await deps.consultar.obtener(p(req, 'viajeId'), id, req.usuarioId ?? ''),
      });
    },
  );

  return router;
}
