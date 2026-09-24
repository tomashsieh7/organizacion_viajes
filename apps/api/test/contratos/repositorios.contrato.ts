import { beforeEach, describe, expect, it } from 'vitest';
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
}
