import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { io as conectarCliente, type Socket } from 'socket.io-client';
import type { AvisoMembresiaFinalizada, MensajeVista } from '@viajes/compartido';
import { crearApp } from '../../src/app.js';
import { conectarTiempoReal } from '../../src/tiempoReal.js';
import { vaciarBase } from '../soporte/baseDePrueba.js';
import { cliente, crearApiDePrueba, ORIGEN, type Cliente } from '../soporte/apiDePrueba.js';

const { contenedor } = crearApiDePrueba();
const db = contenedor.prisma;
let app = crearApp(contenedor);
// El servidor HTTP delega en la app de cada prueba, que se recrea para no acumular límites de registro.
const http = createServer((req, res) => app(req, res));
const io = conectarTiempoReal(http, contenedor);
let url = '';
const sockets: Socket[] = [];

beforeAll(async () => {
  await new Promise<void>((listo) => http.listen(0, listo));
  url = `http://localhost:${(http.address() as AddressInfo).port}/chat`;
});
afterAll(async () => {
  await new Promise<void>((listo) => io.close(() => listo()));
  await db.$disconnect();
});

interface Viajero {
  c: Cliente;
  id: string;
  cookie: string;
}
let ana: Viajero;
let tomas: Viajero;
let viajeId: string;

async function registrar(nombre: string, email: string): Promise<Viajero> {
  const c = cliente(app);
  const r = await c.post('/api/auth/registro', { email, password: 'una-clave-segura', nombre });
  const cookie = String((r.headers['set-cookie'] as unknown as string[])[0]).split(';')[0]!;
  return { c, id: r.body.usuario.id, cookie };
}

async function crearViaje(v: Viajero) {
  return (
    await v.c.post('/api/viajes', {
      nombre: 'Bariloche',
      destino: 'Bariloche',
      fechaInicio: '2026-12-10',
      fechaFin: '2026-12-16',
      monedaCodigo: 'ARS',
    })
  ).body.viaje.id as string;
}

/** Conecta un cliente de Socket.IO como lo haría el navegador, con la cookie y el Origin. */
function conectar(
  cookie: string | null,
  origen = ORIGEN,
  transporte: 'websocket' | 'polling' = 'websocket',
): Promise<{ socket: Socket; error?: string }> {
  const socket = conectarCliente(url, {
    transports: [transporte],
    extraHeaders: { ...(cookie ? { cookie } : {}), origin: origen },
    reconnection: false,
  });
  sockets.push(socket);
  return new Promise((listo) => {
    socket.once('connect', () => listo({ socket }));
    socket.once('connect_error', (e) => listo({ socket, error: e.message }));
  });
}

async function unido(v: Viajero, viaje = viajeId) {
  const { socket } = await conectar(v.cookie);
  const r = await socket.emitWithAck('chat:unirse', { viajeId: viaje });
  return { socket, confirmacion: r };
}

/** Junta lo que recibe un socket en un evento. */
function recibidos<T>(socket: Socket, evento: string): T[] {
  const lista: T[] = [];
  socket.on(evento, (datos: T) => lista.push(datos));
  return lista;
}
const esperar = (ms = 150) => new Promise((listo) => setTimeout(listo, ms));

beforeEach(async () => {
  app = crearApp(contenedor);
  await vaciarBase(db);
  await db.moneda.create({ data: { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 } });
  ana = await registrar('Ana', 'ana@mail.com');
  tomas = await registrar('Tomás', 'tomas@mail.com');
  viajeId = await crearViaje(ana);
  await ana.c.post(`/api/viajes/${viajeId}/participantes`, { email: 'tomas@mail.com' });
});
afterEach(() => {
  for (const s of sockets.splice(0)) s.disconnect();
});

describe('Handshake', () => {
  it('rechaza la conexión sin cookie de sesión o con otro Origin', async () => {
    expect((await conectar(null)).error).toBe('NO_AUTENTICADO');
    expect((await conectar('sesion=inventada')).error).toBe('NO_AUTENTICADO');
    expect((await conectar(ana.cookie, 'https://otro.com')).error).toBe('ORIGEN_NO_PERMITIDO');
    expect((await conectar(ana.cookie)).error).toBeUndefined();
    // El sondeo no se acepta: su primer pedido puede no traer Origin.
    expect((await conectar(ana.cookie, ORIGEN, 'polling')).error).toBeDefined();
  });
});

describe('CU19 por Socket.IO', () => {
  it('dos participantes del mismo viaje reciben el mismo mensaje', async () => {
    const a = await unido(ana);
    const t = await unido(tomas);
    expect([a.confirmacion, t.confirmacion]).toEqual([{ ok: true }, { ok: true }]);
    const deAna = recibidos<MensajeVista>(a.socket, 'chat:mensaje');
    const deTomas = recibidos<MensajeVista>(t.socket, 'chat:mensaje');

    const r = await a.socket.emitWithAck('chat:enviar', {
      viajeId,
      contenido: '  ¿Salimos a las 9?  ',
      idTemporal: 'tmp-1',
    });
    expect(r).toMatchObject({
      ok: true,
      mensaje: { contenido: '¿Salimos a las 9?', idTemporal: 'tmp-1', autor: { id: ana.id } },
    });
    await esperar();
    expect(deAna).toEqual([r.mensaje]);
    expect(deTomas).toEqual([r.mensaje]);
    // El mensaje queda en el historial.
    const h = await tomas.c.get(`/api/viajes/${viajeId}/mensajes`);
    const { idTemporal: _t, ...guardado } = r.mensaje as MensajeVista;
    expect(h.body).toEqual({ mensajes: [guardado], hayMas: false });
  });

  it('un usuario de otro viaje no puede unirse ni enviar, y no recibe nada', async () => {
    const luis = await registrar('Luis', 'luis@mail.com');
    await crearViaje(luis);
    const l = await unido(luis);
    expect(l.confirmacion).toMatchObject({ ok: false, error: { codigo: 'NO_PARTICIPANTE' } });
    const deLuis = recibidos<MensajeVista>(l.socket, 'chat:mensaje');
    const envio = await l.socket.emitWithAck('chat:enviar', {
      viajeId,
      contenido: 'hola',
      idTemporal: 'x',
    });
    expect(envio).toMatchObject({ ok: false, error: { codigo: 'NO_PARTICIPANTE' } });
    const a = await unido(ana);
    await a.socket.emitWithAck('chat:enviar', {
      viajeId,
      contenido: 'solo el grupo',
      idTemporal: 'y',
    });
    await esperar();
    expect(deLuis).toEqual([]);
    // Un id con otro formato tampoco da acceso.
    expect(await l.socket.emitWithAck('chat:unirse', { viajeId: 'no-es-uuid' })).toMatchObject({
      ok: false,
      error: { codigo: 'NO_PARTICIPANTE' },
    });
  });

  it('valida el contenido y deja de aceptar eventos cuando se cierra la sesión', async () => {
    const a = await unido(ana);
    expect(
      await a.socket.emitWithAck('chat:enviar', { viajeId, contenido: '   ', idTemporal: 'x' }),
    ).toMatchObject({ ok: false, error: { codigo: 'VALIDACION' } });
    await ana.c.delete('/api/auth/sesion');
    expect(
      await a.socket.emitWithAck('chat:enviar', { viajeId, contenido: 'hola', idTemporal: 'x' }),
    ).toMatchObject({ ok: false, error: { codigo: 'NO_AUTENTICADO' } });
    await esperar();
    expect(a.socket.connected).toBe(false);
  });
});

describe('Avisos del viaje', () => {
  it('RN-E4: el participante eliminado recibe el aviso y deja de recibir mensajes', async () => {
    const t = await unido(tomas);
    const a = await unido(ana);
    const avisos = recibidos<AvisoMembresiaFinalizada>(t.socket, 'viaje:membresia-finalizada');
    const mensajes = recibidos<MensajeVista>(t.socket, 'chat:mensaje');

    await ana.c.delete(`/api/viajes/${viajeId}/participantes/${tomas.id}`);
    await esperar();
    expect(avisos).toEqual([{ viajeId, motivo: 'ELIMINADO', conservaAccesoSaldos: false }]);

    await a.socket.emitWithAck('chat:enviar', {
      viajeId,
      contenido: 'ya no te llega',
      idTemporal: 'z',
    });
    await esperar();
    expect(mensajes).toEqual([]);
    expect(await t.socket.emitWithAck('chat:unirse', { viajeId })).toMatchObject({ ok: false });
  });

  it('RN-E6: quien sale con saldos pendientes conserva el acceso a saldos', async () => {
    const t = await unido(tomas);
    const avisos = recibidos<AvisoMembresiaFinalizada>(t.socket, 'viaje:membresia-finalizada');
    await db.deuda.create({
      data: { viajeId, deudorId: tomas.id, acreedorId: ana.id, monto: BigInt(1500) },
    });
    await tomas.c.post(`/api/viajes/${viajeId}/salir`, {});
    await esperar();
    expect(avisos).toEqual([{ viajeId, motivo: 'RETIRADO', conservaAccesoSaldos: true }]);
  });

  it('CU24: el traspaso emite viaje:admin-cambiado a la sala', async () => {
    const t = await unido(tomas);
    const a = await unido(ana);
    const deTomas = recibidos(t.socket, 'viaje:admin-cambiado');
    const deAna = recibidos(a.socket, 'viaje:admin-cambiado');
    await ana.c.post(`/api/viajes/${viajeId}/administracion/traspaso`, { nuevoAdminId: tomas.id });
    await esperar();
    const aviso = { viajeId, nuevoAdminId: tomas.id, anteriorAdminId: ana.id };
    expect(deTomas).toEqual([aviso]);
    expect(deAna).toEqual([aviso]);
  });
});

describe('Historial: GET …/mensajes', () => {
  it('pagina hacia atrás sin repetir mensajes', async () => {
    const a = await unido(ana);
    const enviados: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await a.socket.emitWithAck('chat:enviar', {
        viajeId,
        contenido: `m${i}`,
        idTemporal: `t${i}`,
      });
      enviados.push(r.mensaje.id);
    }
    const url = (q: string) => `/api/viajes/${viajeId}/mensajes${q}`;
    const p1 = (await tomas.c.get(url('?limite=2'))).body;
    expect(p1.mensajes.map((m: MensajeVista) => m.contenido)).toEqual(['m3', 'm4']);
    expect(p1.hayMas).toBe(true);
    const p2 = (await tomas.c.get(url(`?limite=2&antesDe=${p1.mensajes[0].id}`))).body;
    expect(p2.mensajes.map((m: MensajeVista) => m.contenido)).toEqual(['m1', 'm2']);
    const p3 = (await tomas.c.get(url(`?limite=2&antesDe=${p2.mensajes[0].id}`))).body;
    expect(p3).toMatchObject({ hayMas: false });
    expect(p3.mensajes.map((m: MensajeVista) => m.contenido)).toEqual(['m0']);
    const ids = [...p3.mensajes, ...p2.mensajes, ...p1.mensajes].map((m: MensajeVista) => m.id);
    expect(ids).toEqual(enviados);

    expect((await tomas.c.get(url('?limite=0'))).status).toBe(400);
    expect((await tomas.c.get(url('?limite=101'))).status).toBe(400);
    expect((await tomas.c.get(url(`?antesDe=${crypto.randomUUID()}`))).status).toBe(404);
    const luis = await registrar('Luis', 'luis@mail.com');
    expect((await luis.c.get(url(''))).status).toBe(403);
  });
});
