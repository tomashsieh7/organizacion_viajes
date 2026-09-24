import { Router, type RequestHandler } from 'express';
import { esquemaConsultaDeudas, esquemaGastoNuevo } from '@viajes/compartido';
import { ErrorDeDominio } from '../../compartido/errores.js';
import { validar } from '../../middlewares/validar.js';
import type {
  AnotarGasto,
  ConsultarDeudas,
  ConsultarGastos,
} from './casos-de-uso/casosDeUsoGastos.js';

export interface DependenciasRutasGastos {
  anotar: AnotarGasto;
  consultar: ConsultarGastos;
  deudas: ConsultarDeudas;
}

const viajeId = (req: { params: Record<string, string | string[] | undefined> }) =>
  String(req.params['viajeId']);

/** `GET /api/categorias-gasto` (sección 5.9 de PLAN.md). */
export function rutasDeCategorias(consultar: ConsultarGastos, autenticado: RequestHandler): Router {
  const router = Router();
  router.get('/categorias-gasto', autenticado, async (_req, res) => {
    res.json({ categorias: await consultar.categoriasDeGasto() });
  });
  return router;
}

/** CU20: gastos del viaje; se montan en el router de viaje, que exige participar. */
export function rutasDeGastos(deps: DependenciasRutasGastos): Router {
  const router = Router({ mergeParams: true });

  router.get('/gastos', async (req, res) => {
    res.json({ gastos: await deps.consultar.listar(viajeId(req)) });
  });

  router.post('/gastos', validar(esquemaGastoNuevo), async (req, res) => {
    const id = await deps.anotar.ejecutar(viajeId(req), req.usuarioId ?? '', req.body);
    res.status(201).json({ gasto: await deps.consultar.obtener(viajeId(req), id) });
  });

  return router;
}

/**
 * CU21 y CU22: deudas propias. Reciben la guarda de acceso a saldos (RN-E6), que se aplica solo
 * a estas rutas: las demás siguen exigiendo participar del viaje.
 */
export function rutasDeSaldos(deudas: ConsultarDeudas, guarda: RequestHandler[]): Router {
  const router = Router({ mergeParams: true });

  router.get('/deudas', ...guarda, async (req, res) => {
    const consulta = esquemaConsultaDeudas.safeParse(req.query);
    if (!consulta.success) {
      throw new ErrorDeDominio('VALIDACION', 'VALIDACION', 'Indicá rol=deudor o rol=acreedor');
    }
    res.json({
      deudas: await deudas.ejecutar(viajeId(req), req.usuarioId ?? '', consulta.data.rol),
    });
  });

  return router;
}
