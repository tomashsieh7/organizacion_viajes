import { Router, type RequestHandler } from 'express';
import { esquemaConsultaDeudas, esquemaGastoNuevo, esquemaPagoNuevo } from '@viajes/compartido';
import { ErrorDeDominio } from '../../compartido/errores.js';
import { validar } from '../../middlewares/validar.js';
import type {
  AnotarGasto,
  ConsultarDeudas,
  ConsultarGastos,
  RegistrarPago,
} from './casos-de-uso/casosDeUsoGastos.js';

export interface DependenciasRutasGastos {
  anotar: AnotarGasto;
  consultar: ConsultarGastos;
  deudas: ConsultarDeudas;
  pagar: RegistrarPago;
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
 * CU21 a CU23: deudas propias y pagos. Reciben la guarda de acceso a saldos (RN-E6), que se
 * aplica solo a estas rutas: las demás siguen exigiendo participar del viaje.
 */
export function rutasDeSaldos(
  deps: Pick<DependenciasRutasGastos, 'deudas' | 'pagar'>,
  guarda: RequestHandler[],
): Router {
  const router = Router({ mergeParams: true });

  router.get('/deudas', ...guarda, async (req, res) => {
    const consulta = esquemaConsultaDeudas.safeParse(req.query);
    if (!consulta.success) {
      throw new ErrorDeDominio('VALIDACION', 'VALIDACION', 'Indicá rol=deudor o rol=acreedor');
    }
    res.json({
      deudas: await deps.deudas.ejecutar(viajeId(req), req.usuarioId ?? '', consulta.data.rol),
    });
  });

  // P17: quien llama es siempre el deudor; el pago se aplica sin confirmación del acreedor.
  router.post('/pagos', ...guarda, validar(esquemaPagoNuevo), async (req, res) => {
    res.status(201).json(await deps.pagar.ejecutar(viajeId(req), req.usuarioId ?? '', req.body));
  });

  return router;
}
