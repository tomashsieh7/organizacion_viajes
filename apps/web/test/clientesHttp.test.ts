import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClienteAuthHttp } from '../src/clientes/auth';
import { ClienteChatSocketIO } from '../src/clientes/chat';
import { ClienteGastosHttp } from '../src/clientes/gastos';
import { ErrorDeApi, pedir } from '../src/clientes/http';
import { ClienteItinerarioHttp } from '../src/clientes/itinerario';
import { ClientePropuestasHttp } from '../src/clientes/propuestas';
import { ClienteViajesHttp } from '../src/clientes/viajes';

/** Reemplaza `fetch` por uno que responde siempre lo indicado y registra cada pedido. */
function responder(estado: number, cuerpo?: unknown) {
  const fetch = vi.fn(
    async (_url: string, _init: RequestInit) =>
      new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado }),
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

const pedido = (fetch: ReturnType<typeof responder>) => {
  const [url, init] = fetch.mock.calls[0]!;
  return { metodo: init.method, url, cuerpo: init.body ? JSON.parse(String(init.body)) : null };
};

afterEach(() => vi.unstubAllGlobals());

describe('pedir', () => {
  it('manda el cuerpo como JSON con la cookie del mismo origen y devuelve la respuesta', async () => {
    const fetch = responder(200, { ok: true });
    expect(await pedir('POST', '/api/x', { a: 1 })).toEqual({ ok: true });
    const [, init] = fetch.mock.calls[0]!;
    expect(init).toMatchObject({
      method: 'POST',
      body: '{"a":1}',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('una respuesta 204 no tiene cuerpo', async () => {
    responder(204);
    expect(await pedir('DELETE', '/api/x')).toBeUndefined();
  });

  it('convierte el error de la API (D19) en ErrorDeApi, con los errores por campo', async () => {
    responder(400, {
      error: {
        codigo: 'VALIDACION',
        mensaje: 'Datos inválidos',
        detalles: [{ campo: 'nombre', mensaje: 'Ingresá un nombre' }],
      },
    });
    const error = await pedir('POST', '/api/x', {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorDeApi);
    expect(error).toMatchObject({ estado: 400, codigo: 'VALIDACION', message: 'Datos inválidos' });
    expect((error as ErrorDeApi).erroresPorCampo).toEqual({ nombre: 'Ingresá un nombre' });
  });

  it('un error sin cuerpo reconocible es un error interno, y sin red es SIN_CONEXION', async () => {
    responder(502);
    await expect(pedir('GET', '/api/x')).rejects.toMatchObject({
      estado: 502,
      codigo: 'ERROR_INTERNO',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    await expect(pedir('GET', '/api/x')).rejects.toMatchObject({
      estado: 0,
      codigo: 'SIN_CONEXION',
    });
  });
});

describe('ClienteAuthHttp', () => {
  it('yo devuelve null sin sesión, en lugar de fallar', async () => {
    responder(401, { error: { codigo: 'NO_AUTENTICADO', mensaje: 'Tenés que iniciar sesión' } });
    expect(await new ClienteAuthHttp().yo()).toBeNull();
  });
});

// Cada método pega en la ruta documentada en docs/api.md, con el método y el cuerpo correctos.
const auth = new ClienteAuthHttp();
const viajes = new ClienteViajesHttp();
const propuestas = new ClientePropuestasHttp();
const gastos = new ClienteGastosHttp();
const itinerario = new ClienteItinerarioHttp();
const chat = new ClienteChatSocketIO();
const datos = { x: 1 } as never;

const RUTAS: [string, () => Promise<unknown>, string, string, unknown][] = [
  ['registrarse', () => auth.registrarse(datos), 'POST', '/api/auth/registro', datos],
  ['ingresar', () => auth.ingresar(datos), 'POST', '/api/auth/sesion', datos],
  ['cerrarSesion', () => auth.cerrarSesion(), 'DELETE', '/api/auth/sesion', null],
  ['monedas', () => viajes.monedas(), 'GET', '/api/monedas', null],
  ['listar viajes', () => viajes.listar(), 'GET', '/api/viajes', null],
  ['crear viaje', () => viajes.crear(datos), 'POST', '/api/viajes', datos],
  ['obtener viaje', () => viajes.obtener('v1'), 'GET', '/api/viajes/v1', null],
  ['participantes', () => viajes.participantes('v1'), 'GET', '/api/viajes/v1/participantes', null],
  [
    'agregar viajero',
    () => viajes.agregarViajero('v1', 'luis@mail.com'),
    'POST',
    '/api/viajes/v1/participantes',
    { email: 'luis@mail.com' },
  ],
  [
    'eliminar participante',
    () => viajes.eliminarParticipante('v1', 'u2'),
    'DELETE',
    '/api/viajes/v1/participantes/u2',
    null,
  ],
  ['salir', () => viajes.salir('v1', 'u2'), 'POST', '/api/viajes/v1/salir', { nuevoAdminId: 'u2' }],
  [
    'traspaso',
    () => viajes.transferirAdministracion('v1', 'u2'),
    'POST',
    '/api/viajes/v1/administracion/traspaso',
    { nuevoAdminId: 'u2' },
  ],
  [
    'alojamientos',
    () => propuestas.listarAlojamientos('v1', 'PENDIENTE'),
    'GET',
    '/api/viajes/v1/alojamientos?estado=PENDIENTE',
    null,
  ],
  [
    'proponer alojamiento',
    () => propuestas.proponerAlojamiento('v1', datos),
    'POST',
    '/api/viajes/v1/alojamientos',
    datos,
  ],
  [
    'actividades',
    () => propuestas.listarActividades('v1'),
    'GET',
    '/api/viajes/v1/actividades',
    null,
  ],
  [
    'actividad',
    () => propuestas.obtenerActividad('v1', 'a1'),
    'GET',
    '/api/viajes/v1/actividades/a1',
    null,
  ],
  [
    'proponer actividad',
    () => propuestas.proponerActividad('v1', datos),
    'POST',
    '/api/viajes/v1/actividades',
    datos,
  ],
  [
    'proponer alternativa',
    () => propuestas.proponerAlternativa('v1', 'a1', datos),
    'POST',
    '/api/viajes/v1/actividades/a1/alternativas',
    datos,
  ],
  [
    'votar',
    () => propuestas.votar('v1', 'p1', 'A_FAVOR'),
    'PUT',
    '/api/viajes/v1/propuestas/p1/voto',
    { valor: 'A_FAVOR' },
  ],
  [
    'desvotar',
    () => propuestas.desvotar('v1', 'p1'),
    'DELETE',
    '/api/viajes/v1/propuestas/p1/voto',
    null,
  ],
  [
    'resolver',
    () => propuestas.resolver('v1', 'p1', 'confirmar'),
    'POST',
    '/api/viajes/v1/propuestas/p1/confirmar',
    null,
  ],
  ['categorías', () => gastos.categorias(), 'GET', '/api/categorias-gasto', null],
  ['gastos', () => gastos.listar('v1'), 'GET', '/api/viajes/v1/gastos', null],
  ['anotar gasto', () => gastos.anotar('v1', datos), 'POST', '/api/viajes/v1/gastos', datos],
  ['deudas', () => gastos.deudas('v1', 'deudor'), 'GET', '/api/viajes/v1/deudas?rol=deudor', null],
  ['pagar', () => gastos.pagar('v1', datos), 'POST', '/api/viajes/v1/pagos', datos],
  ['cronograma', () => itinerario.cronograma('v1'), 'GET', '/api/viajes/v1/cronograma', null],
  [
    'mapa',
    () => itinerario.mapa('v1', '2026-12-11', '2026-12-12'),
    'GET',
    '/api/viajes/v1/mapa?hoy=2026-12-11&dia=2026-12-12',
    null,
  ],
  [
    'historial del chat',
    () => chat.historial('v1', 'm9'),
    'GET',
    '/api/viajes/v1/mensajes?antesDe=m9',
    null,
  ],
];

describe('Rutas de los clientes HTTP', () => {
  it.each(RUTAS)('%s', async (_nombre, llamar, metodo, url, cuerpo) => {
    const fetch = responder(200, {});
    await llamar();
    expect(pedido(fetch)).toEqual({ metodo, url, cuerpo });
  });
});
