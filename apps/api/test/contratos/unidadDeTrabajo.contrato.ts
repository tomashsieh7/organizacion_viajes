import { beforeEach, describe, expect, it } from 'vitest';
import type { UnidadDeTrabajo } from '../../src/compartido/unidadDeTrabajo.js';

/** Repositorio mínimo que usa el contrato para escribir y leer dentro de una transacción. */
export interface RepositorioDeNotas {
  agregar(texto: string): Promise<void>;
  listar(): Promise<string[]>;
}

export interface FabricaDeUnidadDeTrabajo {
  crear(): Promise<{
    unidad: UnidadDeTrabajo<RepositorioDeNotas>;
    leerConfirmado(): Promise<string[]>;
  }>;
}

/**
 * Contrato que toda implementación de `UnidadDeTrabajo` debe cumplir (sustitución de Liskov):
 * lo corren la implementación en memoria y la de Prisma.
 */
export function probarContratoUnidadDeTrabajo(nombre: string, fabrica: FabricaDeUnidadDeTrabajo) {
  describe(`Contrato de UnidadDeTrabajo — ${nombre}`, () => {
    let unidad: UnidadDeTrabajo<RepositorioDeNotas>;
    let leerConfirmado: () => Promise<string[]>;

    beforeEach(async () => {
      ({ unidad, leerConfirmado } = await fabrica.crear());
    });

    it('confirma lo escrito cuando el trabajo termina sin errores', async () => {
      await unidad.ejecutar(async (r) => {
        await r.agregar('a');
        await r.agregar('b');
      });
      expect((await leerConfirmado()).sort()).toEqual(['a', 'b']);
    });

    it('devuelve el resultado del trabajo', async () => {
      const resultado = await unidad.ejecutar(async () => 42);
      expect(resultado).toBe(42);
    });

    it('dentro del trabajo se ven las propias escrituras', async () => {
      const vistas = await unidad.ejecutar(async (r) => {
        await r.agregar('a');
        return r.listar();
      });
      expect(vistas).toEqual(['a']);
    });

    it('revierte todo y propaga el error cuando el trabajo falla', async () => {
      const error = new Error('falla a mitad del trabajo');
      await expect(
        unidad.ejecutar(async (r) => {
          await r.agregar('a');
          throw error;
        }),
      ).rejects.toThrow('falla a mitad del trabajo');
      expect(await leerConfirmado()).toEqual([]);
    });

    it('un trabajo fallido no afecta lo confirmado antes', async () => {
      await unidad.ejecutar(async (r) => r.agregar('a'));
      await expect(
        unidad.ejecutar(async (r) => {
          await r.agregar('b');
          throw new Error('falla');
        }),
      ).rejects.toThrow();
      expect(await leerConfirmado()).toEqual(['a']);
    });
  });
}
