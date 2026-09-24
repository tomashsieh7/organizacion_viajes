import { beforeEach, describe, expect, it } from 'vitest';
import type { Reloj } from '../../src/compartido/reloj.js';
import { IniciarSesion, Registrarse } from '../../src/modulos/auth/casos-de-uso/casosDeUsoAuth.js';
import { EmailContrasena } from '../../src/modulos/auth/dominio/emailContrasena.js';
import type {
  GeneradorDeTokens,
  HasheadorDeContrasenas,
} from '../../src/modulos/auth/dominio/puertos.js';
import { ServicioDeSesiones } from '../../src/modulos/auth/dominio/servicioDeSesiones.js';
import {
  baseVacia,
  RepositorioCuentasEnMemoria,
  RepositorioSesionesEnMemoria,
  type BaseEnMemoria,
} from '../soporte/memoria.js';

/** Hasheador falso y rápido que registra cuántas verificaciones hizo. */
class HasheadorFalso implements HasheadorDeContrasenas {
  verificaciones = 0;
  async hashear(c: string) {
    return `hash:${c}`;
  }
  async verificar(hash: string, c: string) {
    this.verificaciones++;
    return hash === `hash:${c}`;
  }
}

class TokensFalsos implements GeneradorDeTokens {
  private n = 0;
  generar() {
    return `token-${++this.n}`;
  }
  hashear(t: string) {
    return `h(${t})`;
  }
}

const DIA = 24 * 60 * 60 * 1000;
let base: BaseEnMemoria;
let hasheador: HasheadorFalso;
let reloj: Reloj & { t: number };
let proveedor: EmailContrasena;
let sesiones: ServicioDeSesiones;

beforeEach(() => {
  base = baseVacia();
  hasheador = new HasheadorFalso();
  reloj = {
    t: Date.parse('2026-09-24T12:00:00Z'),
    ahora() {
      return new Date(this.t);
    },
  };
  proveedor = new EmailContrasena(new RepositorioCuentasEnMemoria(base), hasheador);
  sesiones = new ServicioDeSesiones(
    new RepositorioSesionesEnMemoria(base),
    new TokensFalsos(),
    reloj,
    7 * DIA,
  );
});

describe('EmailContrasena (P3)', () => {
  it('RN-S2: guarda el email normalizado y la contraseña hasheada', async () => {
    await proveedor.registrar({
      email: '  Ana@Mail.com ',
      password: 'secreta-larga',
      nombre: 'Ana',
    });
    expect(base.credenciales[0]).toMatchObject({
      identificador: 'ana@mail.com',
      secretoHash: 'hash:secreta-larga',
    });
  });

  it('RN-S1: rechaza contraseñas comunes', async () => {
    await expect(
      proveedor.registrar({ email: 'a@b.com', password: 'Password123', nombre: 'A' }),
    ).rejects.toMatchObject({
      codigo: 'CONTRASENA_COMUN',
    });
  });

  it('rechaza un email ya registrado con EMAIL_EN_USO', async () => {
    await proveedor.registrar({ email: 'ana@mail.com', password: 'secreta-larga', nombre: 'Ana' });
    await expect(
      proveedor.registrar({ email: 'ANA@mail.com', password: 'otra-secreta', nombre: 'Otra' }),
    ).rejects.toMatchObject({ codigo: 'EMAIL_EN_USO' });
  });

  it('RN-S3: mismo error y misma verificación exista o no el email', async () => {
    await proveedor.registrar({ email: 'ana@mail.com', password: 'secreta-larga', nombre: 'Ana' });
    const errorExistente = await proveedor
      .autenticar({ email: 'ana@mail.com', password: 'mal' })
      .catch((e) => e);
    const errorInexistente = await proveedor
      .autenticar({ email: 'nadie@mail.com', password: 'mal' })
      .catch((e) => e);
    expect(errorExistente).toMatchObject({ codigo: 'CREDENCIALES_INVALIDAS' });
    expect(errorInexistente).toMatchObject({
      codigo: errorExistente.codigo,
      message: errorExistente.message,
    });
    expect(hasheador.verificaciones).toBe(2);
  });

  it('autentica con el email escrito de otra forma', async () => {
    const cuenta = await proveedor.registrar({
      email: 'ana@mail.com',
      password: 'secreta-larga',
      nombre: 'Ana',
    });
    expect(await proveedor.autenticar({ email: 'ANA@mail.com', password: 'secreta-larga' })).toBe(
      cuenta.usuarioId,
    );
  });
});

describe('ServicioDeSesiones (RN-S5)', () => {
  it('guarda solo el hash del token y valida la sesión vigente', async () => {
    const { token, expiraEn } = await sesiones.crear('u1');
    expect(base.sesiones[0]?.tokenHash).toBe(`h(${token})`);
    expect(expiraEn.getTime() - reloj.t).toBe(7 * DIA);
    expect(await sesiones.validar(token)).toBe('u1');
  });

  it('rechaza sesiones vencidas, revocadas, inexistentes o sin token', async () => {
    const { token } = await sesiones.crear('u1');
    reloj.t += 7 * DIA;
    await expect(sesiones.validar(token)).rejects.toMatchObject({ codigo: 'NO_AUTENTICADO' });
    reloj.t -= DIA;
    await sesiones.revocar(token);
    await expect(sesiones.validar(token)).rejects.toMatchObject({ codigo: 'NO_AUTENTICADO' });
    await expect(sesiones.validar('inventado')).rejects.toMatchObject({ codigo: 'NO_AUTENTICADO' });
    await expect(sesiones.validar(undefined)).rejects.toMatchObject({ codigo: 'NO_AUTENTICADO' });
  });
});

describe('Registrarse e IniciarSesion', () => {
  it('registrarse deja la sesión iniciada', async () => {
    const r = await new Registrarse(proveedor, sesiones).ejecutar({
      email: 'a@b.com',
      password: 'secreta-larga',
      nombre: 'Ana',
    });
    expect(await sesiones.validar(r.sesion.token)).toBe(r.cuenta.usuarioId);
  });

  it('iniciar sesión devuelve la cuenta y una sesión nueva', async () => {
    await new Registrarse(proveedor, sesiones).ejecutar({
      email: 'a@b.com',
      password: 'secreta-larga',
      nombre: 'Ana',
      apodo: ' Ani ',
    });
    const r = await new IniciarSesion(
      proveedor,
      new RepositorioCuentasEnMemoria(base),
      sesiones,
    ).ejecutar({
      email: 'a@b.com',
      password: 'secreta-larga',
    });
    expect(r.cuenta).toMatchObject({ nombre: 'Ana', apodo: 'Ani' });
    expect(base.sesiones).toHaveLength(2);
  });
});
