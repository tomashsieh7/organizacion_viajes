import { Router } from 'express';
import type { RespuestaSalud } from '@viajes/compartido';

/** `GET /api/salud`: indica que el servidor está en pie. */
export function rutasSalud(): Router {
  const router = Router();
  router.get('/salud', (_req, res) => {
    const cuerpo: RespuestaSalud = { ok: true };
    res.json(cuerpo);
  });
  return router;
}
