import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { NotificadorViaje } from '../../src/modulos/chat/dominio/puertos.js';
import type { EventoRecibido } from '../soporte/memoria.js';

export interface EntornoNotificador {
  notificador: NotificadorViaje;
  /** Abre una conexión del usuario que está en el chat del viaje y devuelve lo que recibe. */
  conectar(usuarioId: string, viajeId: string): Promise<EventoRecibido[]>;
  /** Da tiempo a que se entreguen los eventos emitidos. */
  esperar(): Promise<void>;
  cerrar(): Promise<void>;
}

const BAJA = { viajeId: 'v1', motivo: 'ELIMINADO' as const, conservaAccesoSaldos: false };
const TRASPASO = { viajeId: 'v1', nuevoAdminId: 'tomas', anteriorAdminId: 'ana' };

/**
 * Contrato de `NotificadorViaje` (RN-E4 y CU24). Lo cumplen la implementación sobre Socket.IO y la
 * de memoria que usan las pruebas unitarias.
 */
export function probarContratoNotificadorViaje(
  nombre: string,
  crear: () => Promise<EntornoNotificador>,
) {
  describe(`NotificadorViaje — ${nombre}`, () => {
    let e: EntornoNotificador;
    beforeEach(async () => {
      e = await crear();
    });
    afterEach(() => e.cerrar());

    it('avisa la baja en todas las conexiones del usuario y solo a él', async () => {
      const luisCelular = await e.conectar('luis', 'v1');
      const luisCompu = await e.conectar('luis', 'v1');
      const ana = await e.conectar('ana', 'v1');
      await e.notificador.membresiaFinalizada('luis', BAJA);
      await e.esperar();
      expect(luisCelular).toEqual([{ nombre: 'viaje:membresia-finalizada', datos: BAJA }]);
      expect(luisCompu).toEqual([{ nombre: 'viaje:membresia-finalizada', datos: BAJA }]);
      expect(ana).toEqual([]);
    });

    it('después de la baja, el usuario deja de recibir lo que se envía al viaje', async () => {
      const luis = await e.conectar('luis', 'v1');
      const ana = await e.conectar('ana', 'v1');
      await e.notificador.membresiaFinalizada('luis', BAJA);
      await e.notificador.adminCambiado(TRASPASO);
      await e.esperar();
      expect(luis.map((x) => x.nombre)).toEqual(['viaje:membresia-finalizada']);
      expect(ana).toEqual([{ nombre: 'viaje:admin-cambiado', datos: TRASPASO }]);
    });

    it('el cambio de Admin llega a quienes están en ese viaje y no a otros', async () => {
      const ana = await e.conectar('ana', 'v1');
      const tomas = await e.conectar('tomas', 'v1');
      const otro = await e.conectar('sofia', 'v2');
      await e.notificador.adminCambiado(TRASPASO);
      await e.esperar();
      expect(ana).toEqual([{ nombre: 'viaje:admin-cambiado', datos: TRASPASO }]);
      expect(tomas).toEqual([{ nombre: 'viaje:admin-cambiado', datos: TRASPASO }]);
      expect(otro).toEqual([]);
    });
  });
}
