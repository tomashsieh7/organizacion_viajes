import { EmailContrasena } from '../../src/modulos/auth/dominio/emailContrasena.js';
import { HasheadorArgon2 } from '../../src/modulos/auth/infraestructura/adaptadores.js';
import { baseVacia, RepositorioCuentasEnMemoria } from '../soporte/memoria.js';
import { probarContratoProveedorAutenticacion } from './proveedorAutenticacion.contrato.js';

probarContratoProveedorAutenticacion('EmailContrasena con argon2id', async () => {
  const proveedor = new EmailContrasena(
    new RepositorioCuentasEnMemoria(baseVacia()),
    new HasheadorArgon2(),
  );
  const cuenta = await proveedor.registrar({
    email: 'ana@mail.com',
    password: 'una-clave-larga',
    nombre: 'Ana',
  });
  return {
    proveedor,
    usuarioId: cuenta.usuarioId,
    validos: { email: 'ana@mail.com', password: 'una-clave-larga' },
    invalidos: [
      { email: 'ana@mail.com', password: 'otra-clave' },
      { email: 'nadie@mail.com', password: 'una-clave-larga' },
      { email: 'ana@mail.com', password: '' },
    ],
  };
});
