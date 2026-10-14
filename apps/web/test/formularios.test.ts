import { describe, expect, it } from 'vitest';
import { esquemaViajeNuevo } from '@viajes/compartido';
import { erroresDeValidacion } from '../src/utiles/formularios';

describe('erroresDeValidacion', () => {
  it('deja un mensaje por campo a partir de un safeParse fallido', () => {
    const r = esquemaViajeNuevo.safeParse({ nombre: '', destino: 'Bariloche' });
    expect(r.success).toBe(false);
    const errores = erroresDeValidacion(r.error!);
    expect(errores['nombre']).toBe('Ingresá un nombre');
    expect(Object.keys(errores)).not.toContain('destino');
  });
});
