import { beforeEach, describe, expect, it } from 'vitest';
import { BusDeEventosEnMemoria } from '../../src/compartido/eventos.js';
import {
  ConsultarMensajes,
  EnviarMensaje,
  ReenviarEventosDelViaje,
  UnirseAlChat,
} from '../../src/modulos/chat/casos-de-uso/casosDeUsoChat.js';
import { Mensaje } from '../../src/modulos/chat/dominio/mensaje.js';
import type { ConsultaParticipacion } from '../../src/modulos/chat/dominio/puertos.js';
import type {
  AdministracionTransferida,
  MiembroDadoDeBaja,
} from '../../src/modulos/viajes/dominio/eventos.js';

const baja = (datos: Omit<MiembroDadoDeBaja, 'tipo'>): MiembroDadoDeBaja => ({
  tipo: 'viaje.miembro-dado-de-baja',
  ...datos,
});
const traspaso = (datos: Omit<AdministracionTransferida, 'tipo'>): AdministracionTransferida => ({
  tipo: 'viaje.administracion-transferida',
  ...datos,
});
import {
  baseVacia,
  ConsultaMensajesEnMemoria,
  ConsultaSaldosPendientesEnMemoria,
  NotificadorViajeEnMemoria,
  RepositorioMensajesEnMemoria,
  type BaseEnMemoria,
} from '../soporte/memoria.js';

const reloj = { ahora: () => new Date('2026-09-24T12:00:00Z') };
const participan = new Set(['ana', 'tomas']);
const participacion: ConsultaParticipacion = {
  esParticipanteActivo: async (viajeId, usuarioId) => viajeId === 'v1' && participan.has(usuarioId),
};
let base: BaseEnMemoria;
let enviar: EnviarMensaje;

beforeEach(() => {
  base = baseVacia();
  base.usuarios.push({ id: 'ana', nombre: 'Ana', apodo: 'Ani' });
  enviar = new EnviarMensaje(
    participacion,
    new RepositorioMensajesEnMemoria(base),
    new ConsultaMensajesEnMemoria(base),
    reloj,
  );
});

describe('Mensaje', () => {
  const escribir = (contenido: string) =>
    Mensaje.escribir({ id: 'm1', viajeId: 'v1', autorId: 'ana', contenido, ahora: reloj.ahora() });

  it('guarda el contenido sin espacios en los extremos', () => {
    expect(escribir('  Hola  ').aDatos().contenido).toBe('Hola');
    expect(escribir('x'.repeat(2000)).aDatos().contenido).toHaveLength(2000);
  });

  it('rechaza mensajes vacíos o de más de 2000 caracteres', () => {
    for (const contenido of ['', '   ', 'x'.repeat(2001)]) {
      expect(() => escribir(contenido)).toThrow(
        expect.objectContaining({ codigo: 'MENSAJE_INVALIDO' }),
      );
    }
  });
});

describe('CU19: enviar y consultar mensajes', () => {
  it('RN-X5: un participante activo envía y recibe la vista con su autor', async () => {
    const vista = await enviar.ejecutar('v1', 'ana', 'Hola grupo');
    expect(vista).toMatchObject({
      viajeId: 'v1',
      contenido: 'Hola grupo',
      autor: { id: 'ana', nombre: 'Ana', apodo: 'Ani' },
      enviadoEn: '2026-09-24T12:00:00.000Z',
    });
    expect(base.mensajes).toHaveLength(1);
  });

  it('RN-X5: quien no participa no puede enviar ni unirse', async () => {
    await expect(enviar.ejecutar('v1', 'luis', 'Hola')).rejects.toMatchObject({
      codigo: 'NO_PARTICIPANTE',
    });
    await expect(new UnirseAlChat(participacion).ejecutar('v2', 'ana')).rejects.toMatchObject({
      codigo: 'NO_PARTICIPANTE',
    });
    await expect(new UnirseAlChat(participacion).ejecutar('v1', 'ana')).resolves.toBeUndefined();
    expect(base.mensajes).toEqual([]);
  });

  it('el historial responde NO_ENCONTRADO si el cursor no es un mensaje del viaje', async () => {
    const consultar = new ConsultarMensajes(new ConsultaMensajesEnMemoria(base));
    await enviar.ejecutar('v1', 'ana', 'uno');
    expect((await consultar.pagina('v1', undefined, 50)).mensajes).toHaveLength(1);
    await expect(consultar.pagina('v1', 'no-existe', 50)).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    });
  });
});

describe('ReenviarEventosDelViaje (Observer)', () => {
  let bus: BusDeEventosEnMemoria;
  let notificador: NotificadorViajeEnMemoria;

  beforeEach(() => {
    bus = new BusDeEventosEnMemoria();
    notificador = new NotificadorViajeEnMemoria();
    new ReenviarEventosDelViaje(new ConsultaSaldosPendientesEnMemoria(base)).suscribir(
      bus,
      notificador,
    );
  });

  it('RN-E4 y RN-E6: la baja llega como membresía finalizada, con el acceso a saldos', async () => {
    base.deudas.push({ viajeId: 'v1', deudorId: 'ana', acreedorId: 'luis', monto: 500 });
    const luis = notificador.conectar('luis', 'v1');
    const tomas = notificador.conectar('tomas', 'v1');
    await bus.publicar(
      baja({
        viajeId: 'v1',
        usuarioId: 'luis',
        motivo: 'RETIRADO',
        bajaConDeuda: false,
      }),
    );
    await bus.publicar(
      baja({
        viajeId: 'v1',
        usuarioId: 'tomas',
        motivo: 'ELIMINADO',
        bajaConDeuda: false,
      }),
    );
    // Luis no debe, pero le deben: conserva el acceso a saldos (RN-E6).
    expect(luis).toEqual([
      {
        nombre: 'viaje:membresia-finalizada',
        datos: { viajeId: 'v1', motivo: 'RETIRADO', conservaAccesoSaldos: true },
      },
    ]);
    expect(tomas[0]?.datos).toEqual({
      viajeId: 'v1',
      motivo: 'ELIMINADO',
      conservaAccesoSaldos: false,
    });
  });

  it('CU24: el traspaso llega como cambio de Admin', async () => {
    const ana = notificador.conectar('ana', 'v1');
    await bus.publicar(
      traspaso({
        viajeId: 'v1',
        anteriorAdminId: 'ana',
        nuevoAdminId: 'tomas',
      }),
    );
    expect(ana).toEqual([
      {
        nombre: 'viaje:admin-cambiado',
        datos: { viajeId: 'v1', anteriorAdminId: 'ana', nuevoAdminId: 'tomas' },
      },
    ]);
  });
});
