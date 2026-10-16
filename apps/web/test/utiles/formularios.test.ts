import { describe, expect, it } from 'vitest';
import { esquemaViajeNuevo } from '@viajes/compartido';
import { erroresDeValidacion } from '../../src/utiles/formularios';

describe('erroresDeValidacion', () => {
  it('deja un mensaje por campo a partir de un safeParse fallido', () => {
    const r = esquemaViajeNuevo.safeParse({ nombre: '', destino: 'Bariloche' });
    expect(r.success).toBe(false);
    const errores = erroresDeValidacion(r.error!);
    expect(errores['nombre']).toBe('Ingresá un nombre');
    expect(Object.keys(errores)).not.toContain('destino');
  });

  it('los largos máximos se explican en castellano', () => {
    const r = esquemaViajeNuevo.safeParse({
      nombre: 'x'.repeat(81),
      destino: 'y'.repeat(121),
      fechaInicio: '2026-12-10',
      fechaFin: '2026-12-16',
      monedaCodigo: 'ARS',
    });
    const errores = erroresDeValidacion(r.error!);
    expect(errores['nombre']).toBe('Puede tener hasta 80 caracteres');
    expect(errores['destino']).toBe('Puede tener hasta 120 caracteres');
  });
});
