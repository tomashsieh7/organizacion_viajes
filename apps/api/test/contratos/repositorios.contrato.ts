import { beforeEach, describe, expect, it } from 'vitest';
import { RangoFechas } from '../../src/compartido/valores/rangoFechas.js';
import { Coordenadas } from '../../src/compartido/valores/coordenadas.js';
import { Actividad } from '../../src/modulos/actividades/dominio/actividad.js';
import { Propuesta } from '../../src/modulos/propuestas/dominio/propuesta.js';
import { Viaje } from '../../src/modulos/viajes/dominio/viaje.js';
import type { Escenario, Implementacion, Repos } from '../soporte/escenarios.js';

/**
 * Contratos de los repositorios de F2. Los corren la implementación en memoria (que usan las
 * pruebas unitarias) y la de Prisma, así ambas se pueden sustituir entre sí (Liskov).
 */
export function probarContratosDeRepositorios(impl: Implementacion) {
  let e: Escenario;
  let r: Repos;

  beforeEach(async () => {
    ({ escenario: e, repos: r } = await impl.crear());
  });

  describe(`RepositorioCuentas — ${impl.nombre}`, () => {
    const nueva = {
      nombre: 'Ana',
      apodo: 'Ani',
      tipo: 'EMAIL_CONTRASENA' as const,
      identificador: 'ana@mail.com',
      secretoHash: 'hash',
    };

    it('crea la cuenta y la encuentra por su credencial y por su id', async () => {
      const cuenta = await r.cuentas.crear(nueva);
      expect(cuenta).toMatchObject({ nombre: 'Ana', apodo: 'Ani' });
      expect(await r.cuentas.buscarCredencial('EMAIL_CONTRASENA', 'ana@mail.com')).toEqual({
        usuarioId: cuenta.usuarioId,
        secretoHash: 'hash',
      });
      expect(await r.cuentas.obtener(cuenta.usuarioId)).toEqual(cuenta);
    });

    it('rechaza una credencial repetida con IDENTIFICADOR_EN_USO', async () => {
      await r.cuentas.crear(nueva);
      await expect(r.cuentas.crear({ ...nueva, nombre: 'Otra' })).rejects.toMatchObject({
        codigo: 'IDENTIFICADOR_EN_USO',
      });
    });

    it('devuelve null cuando no existe', async () => {
      expect(await r.cuentas.buscarCredencial('EMAIL_CONTRASENA', 'nadie@mail.com')).toBeNull();
      expect(await r.cuentas.obtener(crypto.randomUUID())).toBeNull();
    });
  });

  describe(`RepositorioSesiones — ${impl.nombre}`, () => {
    it('guarda, encuentra y revoca una sesión por el hash de su token', async () => {
      const usuarioId = await e.usuario('Ana');
      const expiraEn = new Date('2030-01-01T00:00:00Z');
      await r.sesiones.crear({ usuarioId, tokenHash: 'abc', expiraEn });
      expect(await r.sesiones.buscarPorTokenHash('abc')).toEqual({
        usuarioId,
        expiraEn,
        revocadaEn: null,
      });
      const ahora = new Date('2029-01-01T00:00:00Z');
      await r.sesiones.revocar('abc', ahora);
      expect((await r.sesiones.buscarPorTokenHash('abc'))?.revocadaEn).toEqual(ahora);
      expect(await r.sesiones.buscarPorTokenHash('otro')).toBeNull();
    });
  });

  describe(`BuscadorDeUsuarios — ${impl.nombre}`, () => {
    it('encuentra por email normalizado', async () => {
      const id = await e.usuario('Ana', 'ana@mail.com');
      expect(await r.buscador.buscarPorIdentificador('EMAIL_CONTRASENA', '  ANA@mail.com ')).toBe(
        id,
      );
      expect(
        await r.buscador.buscarPorIdentificador('EMAIL_CONTRASENA', 'otro@mail.com'),
      ).toBeNull();
    });
  });

  describe(`RepositorioViajes — ${impl.nombre}`, () => {
    it('guarda un viaje nuevo y lo reconstruye con sus membresías', async () => {
      const ana = await e.usuario('Ana');
      const viaje = Viaje.crear({
        id: crypto.randomUUID(),
        nombre: 'Salta',
        destino: 'Salta',
        fechaInicio: '2027-01-02',
        fechaFin: '2027-01-09',
        monedaCodigo: 'ARS',
        creadorId: ana,
        ahora: new Date('2026-09-24T12:00:00Z'),
      });
      await r.viajes.guardar(viaje);
      const leido = await r.viajes.obtenerParaModificar(viaje.id);
      expect(leido?.aDatos()).toEqual(viaje.aDatos());
    });

    it('guarda un traspaso de administración sin violar el Admin único', async () => {
      const ana = await e.usuario('Ana');
      const tomas = await e.usuario('Tomás');
      const id = await e.viaje(ana);
      await e.miembro(id, tomas);
      const viaje = await r.viajes.obtenerParaModificar(id);
      viaje?.transferirAdministracion(ana, tomas);
      await r.viajes.guardar(viaje!);
      const leido = await r.viajes.obtenerParaModificar(id);
      expect(leido?.esAdmin(tomas)).toBe(true);
      expect(leido?.esAdmin(ana)).toBe(false);
    });

    it('devuelve null si el viaje no existe', async () => {
      expect(await r.viajes.obtenerParaModificar(crypto.randomUUID())).toBeNull();
    });
  });

  describe(`ConsultaDeudas — ${impl.nombre}`, () => {
    it('suma solo lo que el usuario debe en ese viaje', async () => {
      const [ana, tomas, luis] = [
        await e.usuario('Ana'),
        await e.usuario('Tomás'),
        await e.usuario('Luis'),
      ];
      const viaje = await e.viaje(ana);
      const otro = await e.viaje(ana);
      await e.deuda(viaje, tomas, ana, 300);
      await e.deuda(viaje, tomas, luis, 200);
      await e.deuda(viaje, ana, tomas, 999);
      await e.deuda(otro, tomas, ana, 50);
      expect(await r.deudas.totalAdeudado(viaje, tomas)).toBe(500);
      expect(await r.deudas.totalAdeudado(viaje, luis)).toBe(0);
    });
  });

  describe(`RetiroDeVotos — ${impl.nombre}`, () => {
    it('retira solo los votos del usuario en propuestas pendientes de ese viaje', async () => {
      const ana = await e.usuario('Ana');
      const tomas = await e.usuario('Tomás');
      const viaje = await e.viaje(ana);
      const otroViaje = await e.viaje(ana);
      await e.voto(viaje, tomas, true);
      const resuelta = await e.voto(viaje, tomas, false);
      const deOtroViaje = await e.voto(otroViaje, tomas, true);
      const deAna = await e.voto(viaje, ana, true);
      await r.votos.retirarVotosPendientes(viaje, tomas);
      expect((await e.propuestasVotadasPor(tomas)).sort()).toEqual([resuelta, deOtroViaje].sort());
      expect(await e.propuestasVotadasPor(ana)).toEqual([deAna]);
    });
  });

  describe(`ConsultaViajes — ${impl.nombre}`, () => {
    it('da acceso y lista viajes solo con membresía activa', async () => {
      const ana = await e.usuario('Ana');
      const tomas = await e.usuario('Tomás');
      const viaje = await e.viaje(ana);
      await e.miembro(viaje, tomas, 'ELIMINADA');
      expect(await r.consultas.obtenerAcceso(viaje, ana)).toEqual({ rol: 'ADMIN' });
      expect(await r.consultas.obtenerAcceso(viaje, tomas)).toBeNull();
      expect(await r.consultas.listarDeUsuario(tomas)).toEqual([]);
      expect(await r.consultas.listarDeUsuario(ana)).toEqual([
        expect.objectContaining({
          id: viaje,
          fechaInicio: '2026-12-10',
          fechaFin: '2026-12-16',
          miRol: 'ADMIN',
        }),
      ]);
    });

    it('lista participantes activos con nombre, Admin primero', async () => {
      const ana = await e.usuario('Zoe');
      const tomas = await e.usuario('Beto');
      const luis = await e.usuario('Luis');
      const viaje = await e.viaje(ana);
      await e.miembro(viaje, tomas);
      await e.miembro(viaje, luis, 'RETIRADA');
      expect((await r.consultas.listarParticipantes(viaje)).map((p) => [p.nombre, p.rol])).toEqual([
        ['Zoe', 'ADMIN'],
        ['Beto', 'VIAJERO'],
      ]);
      expect(await r.consultas.obtenerParticipante(viaje, luis)).toBeNull();
    });

    it('devuelve el detalle con la moneda y la cantidad de participantes activos', async () => {
      const ana = await e.usuario('Ana');
      const tomas = await e.usuario('Tomás');
      const viaje = await e.viaje(ana);
      await e.miembro(viaje, tomas);
      expect(await r.consultas.obtenerDetalle(viaje, tomas)).toMatchObject({
        id: viaje,
        miRol: 'VIAJERO',
        moneda: { codigo: 'ARS', decimales: 2 },
        cantidadParticipantes: 2,
      });
      expect(await r.consultas.obtenerDetalle(viaje, crypto.randomUUID())).toBeNull();
      expect(await r.consultas.existeMoneda('ARS')).toBe(true);
      expect(await r.consultas.existeMoneda('XXX')).toBe(false);
    });
  });

  describe(`Propuestas y alojamientos — ${impl.nombre}`, () => {
    const AHORA = new Date('2026-09-24T12:00:00.000Z');
    const alojamiento = (
      viajeId: string,
      autorId: string,
      nombre: string,
      desde: string,
      hasta: string,
    ) => {
      const p = Propuesta.proponer({
        id: crypto.randomUUID(),
        viajeId,
        autorId,
        tipo: 'ALOJAMIENTO',
        descripcion: `desc ${nombre}`,
        precio: 1500,
        ubicacion: 'Centro',
        coordenadas: null,
        ahora: AHORA,
      });
      return {
        p,
        crear: () => r.alojamientos.crear(p, { nombre, estadia: RangoFechas.crear(desde, hasta) }),
      };
    };

    it('ConsultaFechasDeViaje devuelve el rango del viaje o null', async () => {
      const ana = await e.usuario('Ana');
      const viaje = await e.viaje(ana);
      expect(await r.fechas.rango(viaje)).toEqual(RangoFechas.crear('2026-12-10', '2026-12-16'));
      expect(await r.fechas.rango(crypto.randomUUID())).toBeNull();
    });

    it('crea un alojamiento y lo reconstruye como propuesta del viaje', async () => {
      const ana = await e.usuario('Ana');
      const viaje = await e.viaje(ana);
      const { p, crear } = alojamiento(viaje, ana, 'Hostel', '2026-12-10', '2026-12-13');
      await crear();
      expect((await r.propuestas.obtenerParaModificar(viaje, p.id))?.aDatos()).toEqual(p.aDatos());
      expect(await r.propuestas.obtenerParaModificar(await e.viaje(ana), p.id)).toBeNull();
    });

    it('guarda estado y sincroniza votos (alta, cambio y baja)', async () => {
      const ana = await e.usuario('Ana');
      const tomas = await e.usuario('Tomás');
      const viaje = await e.viaje(ana);
      const { p, crear } = alojamiento(viaje, ana, 'Hostel', '2026-12-10', '2026-12-13');
      await crear();
      const cargada = (await r.propuestas.obtenerParaModificar(viaje, p.id))!;
      cargada.votar(ana, 'A_FAVOR', AHORA);
      cargada.votar(tomas, 'A_FAVOR', AHORA);
      await r.propuestas.guardar(cargada);
      const otra = (await r.propuestas.obtenerParaModificar(viaje, p.id))!;
      otra.votar(ana, 'EN_CONTRA', AHORA);
      otra.desvotar(tomas);
      otra.resolver('confirmar', ana, AHORA);
      await r.propuestas.guardar(otra);
      const final = (await r.propuestas.obtenerParaModificar(viaje, p.id))!.aDatos();
      expect(final.estado).toBe('CONFIRMADA');
      expect(final.resueltaPorId).toBe(ana);
      expect(final.votos).toEqual([{ usuarioId: ana, valor: 'EN_CONTRA', emitidoEn: AHORA }]);
    });

    it('lista alojamientos por fecha de entrada, con conteo, voto propio y filtro por estado', async () => {
      const ana = await e.usuario('Ana');
      const tomas = await e.usuario('Tomás');
      const viaje = await e.viaje(ana);
      const tarde = alojamiento(viaje, ana, 'Cabaña', '2026-12-13', '2026-12-16');
      const temprano = alojamiento(viaje, tomas, 'Hostel', '2026-12-10', '2026-12-13');
      await tarde.crear();
      await temprano.crear();
      const p = (await r.propuestas.obtenerParaModificar(viaje, tarde.p.id))!;
      p.votar(tomas, 'A_FAVOR', AHORA);
      p.votar(ana, 'EN_CONTRA', AHORA);
      p.resolver('confirmar', ana, AHORA);
      await r.propuestas.guardar(p);

      const lista = await r.consultaAlojamientos.listar(viaje, tomas);
      expect(lista.map((a) => a.alojamiento.nombre)).toEqual(['Hostel', 'Cabaña']);
      expect(lista[1]).toMatchObject({
        estado: 'CONFIRMADA',
        precio: 1500,
        votosAFavor: 1,
        votosEnContra: 1,
        miVoto: 'A_FAVOR',
        autor: { usuarioId: ana, nombre: 'Ana' },
        creadaEn: AHORA.toISOString(),
        alojamiento: { nombre: 'Cabaña', fechaDesde: '2026-12-13', fechaHasta: '2026-12-16' },
      });
      expect(
        (await r.consultaAlojamientos.listar(viaje, tomas, 'PENDIENTE')).map((a) => a.id),
      ).toEqual([temprano.p.id]);
      expect((await r.consultaAlojamientos.obtener(viaje, temprano.p.id, ana))?.miVoto).toBeNull();
      expect(await r.consultaAlojamientos.obtener(viaje, crypto.randomUUID(), ana)).toBeNull();
      expect(await r.consultaPropuestas.obtenerVista(viaje, tarde.p.id, ana)).toMatchObject({
        miVoto: 'EN_CONTRA',
        tipo: 'ALOJAMIENTO',
      });
    });
  });

  describe(`Actividades — ${impl.nombre}`, () => {
    let segundos = 0;
    const actividad = (
      viajeId: string,
      autorId: string,
      titulo: string,
      fecha: string,
      horaInicio: string,
      duracionMin: number,
    ) => ({
      id: crypto.randomUUID(),
      viajeId,
      autorId,
      titulo,
      descripcion: `desc ${titulo}`,
      ubicacion: 'Cerro',
      coordenadas: Coordenadas.crear(-41.1, -71.4),
      precio: 5000,
      fecha,
      horaInicio,
      duracionMin,
      // Cada actividad se crea un segundo después de la anterior, para que el orden sea estable.
      ahora: new Date(Date.UTC(2026, 8, 24, 12, 0, segundos++)),
    });

    async function confirmar(viajeId: string, id: string, adminId: string) {
      const p = (await r.propuestas.obtenerParaModificar(viajeId, id))!;
      p.resolver('confirmar', adminId, new Date('2026-09-25T12:00:00Z'));
      await r.propuestas.guardar(p);
    }

    it('crea una actividad y la reconstruye con su detalle', async () => {
      const ana = await e.usuario('Ana');
      const viaje = await e.viaje(ana);
      const kayak = Actividad.proponer(actividad(viaje, ana, 'Kayak', '2026-12-11', '10:00', 120));
      await r.actividades.crear(kayak);

      const cargada = await r.actividades.obtenerParaModificar(viaje, kayak.id);
      expect(cargada?.propuesta.aDatos()).toEqual(kayak.propuesta.aDatos());
      expect(cargada?.detalle).toEqual(kayak.detalle);
      expect(await r.actividades.obtenerParaModificar(await e.viaje(ana), kayak.id)).toBeNull();
      // Una propuesta de otro tipo no es una actividad.
      const alojamiento = await e.voto(viaje, ana, true);
      expect(await r.actividades.obtenerParaModificar(viaje, alojamiento)).toBeNull();
    });

    it('confirmadas devuelve solo las confirmadas del viaje, por horario y con su intervalo', async () => {
      const ana = await e.usuario('Ana');
      const viaje = await e.viaje(ana);
      const otroViaje = await e.viaje(ana);
      const tarde = Actividad.proponer(actividad(viaje, ana, 'Cena', '2026-12-11', '21:00', 90));
      const temprano = Actividad.proponer(
        actividad(viaje, ana, 'Kayak', '2026-12-11', '10:00', 120),
      );
      const pendiente = Actividad.proponer(
        actividad(viaje, ana, 'Museo', '2026-12-12', '10:00', 60),
      );
      const ajena = Actividad.proponer(
        actividad(otroViaje, ana, 'Otro', '2026-12-11', '10:00', 60),
      );
      for (const a of [tarde, temprano, pendiente, ajena]) await r.actividades.crear(a);
      await confirmar(viaje, tarde.id, ana);
      await confirmar(viaje, temprano.id, ana);
      await confirmar(otroViaje, ajena.id, ana);

      const confirmadas = await r.actividades.confirmadas(viaje);
      expect(confirmadas.map(({ intervalo: _i, ...c }) => c)).toEqual([
        {
          id: temprano.id,
          titulo: 'Kayak',
          fecha: '2026-12-11',
          horaInicio: '10:00',
          duracionMin: 120,
        },
        { id: tarde.id, titulo: 'Cena', fecha: '2026-12-11', horaInicio: '21:00', duracionMin: 90 },
      ]);
      expect(confirmadas[0]!.intervalo).toEqual(temprano.intervalo);
    });

    it('opcionesDelGrupo devuelve la original y sus alternativas', async () => {
      const ana = await e.usuario('Ana');
      const viaje = await e.viaje(ana);
      const original = Actividad.proponer(
        actividad(viaje, ana, 'Kayak', '2026-12-11', '10:00', 120),
      );
      const alt1 = original.crearAlternativa(
        actividad(viaje, ana, 'Trekking', '2026-12-11', '10:00', 120),
      );
      const alt2 = original.crearAlternativa(
        actividad(viaje, ana, 'Bici', '2026-12-11', '10:00', 90),
      );
      const suelta = Actividad.proponer(actividad(viaje, ana, 'Cena', '2026-12-11', '21:00', 90));
      for (const a of [original, alt1, alt2, suelta]) await r.actividades.crear(a);

      const esperado = [original.id, alt1.id, alt2.id].sort();
      expect((await r.actividades.opcionesDelGrupo(viaje, original.id)).map((a) => a.id)).toEqual(
        esperado,
      );
      expect(await r.actividades.opcionesDelGrupo(await e.viaje(ana), original.id)).toEqual([]);
      await expect(r.actividades.bloquearAgenda(viaje)).resolves.toBeUndefined();
    });

    it('lista por fecha y hora, con hora de fin, alternativa, voto propio y filtro por estado', async () => {
      const ana = await e.usuario('Ana');
      const tomas = await e.usuario('Tomás');
      const viaje = await e.viaje(ana);
      const noche = Actividad.proponer(
        actividad(viaje, tomas, 'Boliche', '2026-12-11', '23:30', 180),
      );
      const manana = Actividad.proponer(actividad(viaje, ana, 'Kayak', '2026-12-11', '10:00', 120));
      const alternativa = manana.crearAlternativa(
        actividad(viaje, tomas, 'Trekking', '2026-12-11', '10:00', 60),
      );
      for (const a of [noche, manana, alternativa]) await r.actividades.crear(a);
      await r.alojamientos.crear(
        Propuesta.proponer({
          id: crypto.randomUUID(),
          viajeId: viaje,
          autorId: ana,
          tipo: 'ALOJAMIENTO',
          descripcion: 'x',
          ubicacion: 'y',
          coordenadas: null,
          ahora: new Date(),
        }),
        { nombre: 'Hostel', estadia: RangoFechas.crear('2026-12-10', '2026-12-12') },
      );
      const p = (await r.propuestas.obtenerParaModificar(viaje, manana.id))!;
      p.votar(tomas, 'A_FAVOR', new Date('2026-09-25T12:00:00Z'));
      await r.propuestas.guardar(p);
      await confirmar(viaje, noche.id, ana);

      const lista = await r.consultaActividades.listar(viaje, tomas);
      expect(lista.map((a) => a.actividad.titulo)).toEqual(['Kayak', 'Trekking', 'Boliche']);
      expect(lista[0]).toMatchObject({
        tipo: 'ACTIVIDAD',
        estado: 'PENDIENTE',
        precio: 5000,
        latitud: -41.1,
        longitud: -71.4,
        votosAFavor: 1,
        miVoto: 'A_FAVOR',
        autor: { usuarioId: ana, nombre: 'Ana' },
        actividad: {
          titulo: 'Kayak',
          fecha: '2026-12-11',
          horaInicio: '10:00',
          horaFin: '12:00',
          duracionMin: 120,
          alternativaDe: null,
        },
      });
      expect(lista[1]!.actividad.alternativaDe).toEqual({ id: manana.id, titulo: 'Kayak' });
      expect(lista[2]!.actividad.horaFin).toBe('02:30');
      expect(
        (await r.consultaActividades.listar(viaje, tomas, 'CONFIRMADA')).map((a) => a.id),
      ).toEqual([noche.id]);
      expect((await r.consultaActividades.obtener(viaje, alternativa.id, ana))?.miVoto).toBeNull();
      expect(await r.consultaActividades.obtener(await e.viaje(ana), manana.id, ana)).toBeNull();
    });
  });
}
