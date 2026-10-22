import { describe, expect, it, vi } from 'vitest';
import { proponerUnaVez } from '../../src/modulos/propuestas/casos-de-uso/proponerUnaVez.js';
import { propuestaExistente } from '../../src/modulos/propuestas/dominio/propuesta.js';
import type { OrigenDePropuesta } from '../../src/modulos/propuestas/dominio/puertos.js';

const intento = { id: 'p1', viajeId: 'v1', autorId: 'ana', tipo: 'ACTIVIDAD' as const };
const origenes = (...respuestas: (OrigenDePropuesta | null)[]) => {
  const origen = vi.fn();
  for (const r of respuestas) origen.mockResolvedValueOnce(r);
  return { origen };
};

describe('proponerUnaVez (CU05, CU10 y CU11)', () => {
  it('crea la propuesta si todavía no existe', async () => {
    const crear = vi.fn(async () => {});
    await proponerUnaVez(origenes(null), intento, crear);
    expect(crear).toHaveBeenCalledTimes(1);
  });

  it('no la vuelve a crear si el mismo intento ya la guardó', async () => {
    const crear = vi.fn(async () => {});
    await proponerUnaVez(origenes(intento), intento, crear);
    expect(crear).not.toHaveBeenCalled();
  });

  it('rechaza el id de una propuesta de otra persona, de otro viaje o de otro tipo', async () => {
    for (const otra of [
      { ...intento, autorId: 'beto' },
      { ...intento, viajeId: 'v2' },
      { ...intento, tipo: 'ALOJAMIENTO' as const },
    ]) {
      const crear = vi.fn(async () => {});
      await expect(proponerUnaVez(origenes(otra), intento, crear)).rejects.toMatchObject({
        codigo: 'PROPUESTA_EXISTENTE',
      });
      expect(crear).not.toHaveBeenCalled();
    }
  });

  it('si otro envío del mismo intento la guardó justo antes, no es un error', async () => {
    const crear = vi.fn(async () => {
      throw propuestaExistente();
    });
    await expect(proponerUnaVez(origenes(null, intento), intento, crear)).resolves.toBeUndefined();
  });

  it('cualquier otro error al crear se propaga', async () => {
    const crear = vi.fn(async () => {
      throw new Error('se cayó la base');
    });
    await expect(proponerUnaVez(origenes(null), intento, crear)).rejects.toThrow('se cayó la base');
  });
});
