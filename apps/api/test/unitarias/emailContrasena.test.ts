import { beforeEach, describe, expect, it } from 'vitest';
import { EmailContrasena } from '../../src/modulos/auth/dominio/emailContrasena.js';
import { HasheadorArgon2 } from '../../src/modulos/auth/infraestructura/adaptadores.js';
import { baseVacia, RepositorioCuentasEnMemoria } from '../soporte/memoria.js';

describe('EmailContrasena con argon2id (D7)', () => {
  let proveedor: EmailContrasena;
  let usuarioId: string;

  beforeEach(async () => {
    proveedor = new EmailContrasena(
      new RepositorioCuentasEnMemoria(baseVacia()),
      new HasheadorArgon2(),
    );
    ({ usuarioId } = await proveedor.registrar({
      email: 'ana@mail.com',
      password: 'una-clave-larga',
      nombre: 'Ana',
    }));
  });

  it('devuelve el usuario con credenciales válidas', async () => {
    expect(await proveedor.autenticar({ email: 'ana@mail.com', password: 'una-clave-larga' })).toBe(
      usuarioId,
    );
  });

  it('rechaza toda credencial inválida con CREDENCIALES_INVALIDAS', async () => {
    const invalidos = [
      { email: 'ana@mail.com', password: 'otra-clave' },
      { email: 'nadie@mail.com', password: 'una-clave-larga' },
      { email: 'ana@mail.com', password: '' },
    ];
    for (const datos of invalidos) {
      await expect(proveedor.autenticar(datos)).rejects.toMatchObject({
        categoria: 'NO_AUTENTICADO',
        codigo: 'CREDENCIALES_INVALIDAS',
      });
    }
  });
});
