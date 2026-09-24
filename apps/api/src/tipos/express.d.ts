import type { Rol, TipoAcceso } from '@viajes/compartido';

declare global {
  namespace Express {
    interface Request {
      /** Usuario de la sesión, lo completa el middleware `autenticado`. */
      usuarioId?: string;
      /** Acceso de ese usuario al viaje de la ruta, lo completan `participanteActivo` y `accesoSaldos`. */
      acceso?: { viajeId: string; rol: Rol; tipo: TipoAcceso };
    }
  }
}

export {};
