import { Router, type RequestHandler } from 'express';
import {
  esquemaAgregarViajero,
  esquemaSalirDelViaje,
  esquemaTraspaso,
  esquemaViajeNuevo,
  type RespuestaBaja,
} from '@viajes/compartido';
import { parametroUuid, soloAdmin } from '../../middlewares/acceso.js';
import { validar } from '../../middlewares/validar.js';
import type {
  AgregarViajero,
  ConsultarViajes,
  CrearViaje,
  EliminarParticipante,
  SalirDelViaje,
  TransferirAdministracion,
} from './casos-de-uso/casosDeUsoViajes.js';

export interface DependenciasRutasViajes {
  crearViaje: CrearViaje;
  agregarViajero: AgregarViajero;
  eliminarParticipante: EliminarParticipante;
  salirDelViaje: SalirDelViaje;
  transferirAdministracion: TransferirAdministracion;
  consultar: ConsultarViajes;
  autenticado: RequestHandler;
  participanteActivo: RequestHandler;
}

/** Controlador y rutas de grupo y participantes (sección 5.3 de PLAN.md). */
export function rutasViajes(deps: DependenciasRutasViajes): Router {
  const router = Router();
  const usuario = (req: { usuarioId?: string }) => req.usuarioId ?? '';

  router.get('/monedas', deps.autenticado, async (_req, res) => {
    res.json({ monedas: await deps.consultar.monedas() });
  });

  router.post('/viajes', deps.autenticado, validar(esquemaViajeNuevo), async (req, res) => {
    const id = await deps.crearViaje.ejecutar(usuario(req), req.body);
    res.status(201).json({ viaje: await deps.consultar.detalle(id, usuario(req)) });
  });

  router.get('/viajes', deps.autenticado, async (req, res) => {
    res.json({ viajes: await deps.consultar.listarMisViajes(usuario(req)) });
  });

  const viaje = Router({ mergeParams: true });
  viaje.use(deps.autenticado, deps.participanteActivo);
  const viajeId = (req: { params: Record<string, string | string[] | undefined> }) =>
    String(req.params['viajeId']);

  viaje.get('/', async (req, res) => {
    res.json({ viaje: await deps.consultar.detalle(viajeId(req), usuario(req)) });
  });

  viaje.get('/participantes', async (req, res) => {
    res.json({ participantes: await deps.consultar.participantes(viajeId(req)) });
  });

  viaje.post('/participantes', soloAdmin, validar(esquemaAgregarViajero), async (req, res) => {
    const nuevoId = await deps.agregarViajero.ejecutar(viajeId(req), usuario(req), req.body.email);
    res
      .status(201)
      .json({ participante: await deps.consultar.participante(viajeId(req), nuevoId) });
  });

  viaje.delete(
    '/participantes/:usuarioId',
    soloAdmin,
    parametroUuid('usuarioId'),
    async (req, res) => {
      const bajaConDeuda = await deps.eliminarParticipante.ejecutar(
        viajeId(req),
        usuario(req),
        String(req.params['usuarioId']),
      );
      const cuerpo: RespuestaBaja = { bajaConDeuda };
      res.json(cuerpo);
    },
  );

  viaje.post('/salir', validar(esquemaSalirDelViaje), async (req, res) => {
    const bajaConDeuda = await deps.salirDelViaje.ejecutar(
      viajeId(req),
      usuario(req),
      req.body.nuevoAdminId,
    );
    const cuerpo: RespuestaBaja = { bajaConDeuda };
    res.json(cuerpo);
  });

  viaje.post('/administracion/traspaso', soloAdmin, validar(esquemaTraspaso), async (req, res) => {
    await deps.transferirAdministracion.ejecutar(viajeId(req), usuario(req), req.body.nuevoAdminId);
    res.status(204).end();
  });

  router.use('/viajes/:viajeId', viaje);
  return router;
}
