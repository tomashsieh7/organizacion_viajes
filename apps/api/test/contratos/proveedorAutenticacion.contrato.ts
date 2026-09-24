import { describe, expect, it } from 'vitest';
import type { ProveedorAutenticacion } from '../../src/modulos/auth/dominio/puertos.js';

/**
 * Contrato de toda forma de ingreso (D7): con credenciales válidas devuelve el usuario y con
 * credenciales inválidas lanza NO_AUTENTICADO `CREDENCIALES_INVALIDAS`.
 */
export function probarContratoProveedorAutenticacion<D>(
  nombre: string,
  preparar: () => Promise<{
    proveedor: ProveedorAutenticacion<D>;
    validos: D;
    usuarioId: string;
    invalidos: D[];
  }>,
) {
  describe(`Contrato de ProveedorAutenticacion — ${nombre}`, () => {
    it('devuelve el usuario con credenciales válidas', async () => {
      const { proveedor, validos, usuarioId } = await preparar();
      expect(await proveedor.autenticar(validos)).toBe(usuarioId);
    });

    it('rechaza toda credencial inválida con CREDENCIALES_INVALIDAS', async () => {
      const { proveedor, invalidos } = await preparar();
      for (const datos of invalidos) {
        await expect(proveedor.autenticar(datos)).rejects.toMatchObject({
          categoria: 'NO_AUTENTICADO',
          codigo: 'CREDENCIALES_INVALIDAS',
        });
      }
    });
  });
}
