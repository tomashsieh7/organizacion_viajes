import { describe, expect, it, vi } from 'vitest';
import { PropuestasConAgendaBloqueadaPrimero } from '../../src/modulos/actividades/casos-de-uso/agendaBloqueadaPrimero.js';
import type { RepositorioActividades } from '../../src/modulos/actividades/dominio/puertos.js';
import type { Propuesta } from '../../src/modulos/propuestas/dominio/propuesta.js';
import type { RepositorioPropuestas } from '../../src/modulos/propuestas/dominio/puertos.js';

describe('PropuestasConAgendaBloqueadaPrimero', () => {
  it('bloquea la agenda del viaje antes de cargar la propuesta y delega el resto', async () => {
    const orden: string[] = [];
    const propuesta = { id: 'p1' } as Propuesta;
    const propuestas: RepositorioPropuestas = {
      obtenerParaModificar: vi.fn(async () => (orden.push('propuesta'), propuesta)),
      guardar: vi.fn(async () => undefined),
    };
    const actividades = {
      bloquearAgenda: vi.fn(async () => void orden.push('agenda')),
    } as unknown as RepositorioActividades;
    const repo = new PropuestasConAgendaBloqueadaPrimero(propuestas, actividades);

    expect(await repo.obtenerParaModificar('v1', 'p1')).toBe(propuesta);
    expect(orden).toEqual(['agenda', 'propuesta']);
    expect(actividades.bloquearAgenda).toHaveBeenCalledWith('v1');
    await repo.guardar(propuesta);
    expect(propuestas.guardar).toHaveBeenCalledWith(propuesta);
  });
});
