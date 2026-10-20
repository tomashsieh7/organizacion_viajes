import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import DialogoNuevoViaje from '../../../src/componentes/viajes/DialogoNuevoViaje.vue';
import { ErrorDeApi } from '../../../src/clientes/http';
import {
  clienteAuthFalso,
  clienteViajesFalso,
  detalle,
  montaje,
} from '../../soporte/clientesFalsos';

const ARS = { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 };

function montar(
  crear = vi.fn(async () => detalle('ADMIN')),
  obtener = vi.fn(async () => detalle('ADMIN')),
) {
  const agregarViajero = vi.fn(async () => ({
    usuarioId: 'tomas',
    nombre: 'Tomás',
    apodo: null,
    rol: 'VIAJERO' as const,
  }));
  const opciones = montaje(
    clienteAuthFalso(),
    clienteViajesFalso({ monedas: async () => [ARS], crear, obtener, agregarViajero }),
  );
  return { dialogo: mount(DialogoNuevoViaje, opciones), crear, agregarViajero };
}
type Dialogo = ReturnType<typeof montar>['dialogo'];

async function pasoUno(dialogo: Dialogo, pais = 'Argentina') {
  await dialogo.find('#viaje-nombre').setValue('Bariloche 2026');
  await dialogo.find('#viaje-ciudad').setValue('Bariloche');
  await dialogo.find('#viaje-pais').setValue(pais);
  await dialogo.find('form').trigger('submit');
  await flushPromises();
}

async function pasoDos(dialogo: Dialogo) {
  await dialogo.find('#viaje-inicio').setValue('2026-12-10');
  await dialogo.find('#viaje-fin').setValue('2026-12-16');
  await dialogo.find('form').trigger('submit');
  await flushPromises();
}

describe('DialogoNuevoViaje (CU01)', () => {
  it('valida cada paso antes de avanzar, sin llamar a la API', async () => {
    const { dialogo, crear } = montar();
    await flushPromises();
    expect(dialogo.text()).toContain('Paso 1 de 3');
    await dialogo.find('form').trigger('submit');
    expect(dialogo.text()).toContain('Ingresá un nombre');
    expect(dialogo.text()).toContain('Ingresá la ciudad');
    // Las fechas son del paso 2: todavía no se validan.
    expect(dialogo.find('#viaje-inicio').exists()).toBe(false);

    await pasoUno(dialogo);
    expect(dialogo.text()).toContain('Paso 2 de 3');
    await dialogo.find('form').trigger('submit');
    expect(crear).not.toHaveBeenCalled();
  });

  it('arma el destino con la ciudad y el país, y crea el viaje al terminar el paso 2', async () => {
    const { dialogo, crear } = montar();
    await flushPromises();
    await pasoUno(dialogo);
    await pasoDos(dialogo);
    expect(crear).toHaveBeenCalledWith({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
      nombre: 'Bariloche 2026',
      destino: 'Bariloche, Argentina',
      fechaInicio: '2026-12-10',
      fechaFin: '2026-12-16',
      monedaCodigo: 'ARS',
    });
    expect(dialogo.text()).toContain('Paso 3 de 3');
    expect(dialogo.emitted('creado')).toBeUndefined();
  });

  it('RN-X7: no deja crear un viaje de más de un año y el calendario no ofrece fechas después', async () => {
    const { dialogo, crear } = montar();
    await flushPromises();
    await pasoUno(dialogo);
    await dialogo.find('#viaje-inicio').setValue('2026-12-10');
    expect(dialogo.find('#viaje-fin').attributes('max')).toBe('2027-12-10');
    await dialogo.find('#viaje-fin').setValue('2062-12-16');
    await dialogo.find('form').trigger('submit');
    await flushPromises();
    expect(dialogo.text()).toContain('Un viaje puede durar hasta un año');
    expect(crear).not.toHaveBeenCalled();
  });

  it('las fechas vacías piden elegir una, y los campos solo ofrecen del año 2000 al 2100', async () => {
    const { dialogo } = montar();
    await flushPromises();
    await pasoUno(dialogo);
    await dialogo.find('form').trigger('submit');
    expect(dialogo.find('#viaje-inicio-error').text()).toContain('Elegí una fecha');
    expect(dialogo.find('#viaje-fin-error').text()).toContain('Elegí una fecha');
    expect(dialogo.find('#viaje-inicio').attributes()).toMatchObject({
      min: '2000-01-01',
      max: '2100-12-31',
    });
    await dialogo.find('#viaje-inicio').setValue('2100-06-01');
    expect(dialogo.find('#viaje-fin').attributes('max')).toBe('2100-12-31');
    await dialogo.find('#viaje-inicio').setValue('0026-12-10');
    await dialogo.find('form').trigger('submit');
    expect(dialogo.find('#viaje-inicio-error').text()).toContain(
      'Elegí una fecha entre el año 2000 y el 2100',
    );
  });

  it('RN-X8: un carácter prohibido en el país se marca en el país', async () => {
    const { dialogo, crear } = montar();
    await flushPromises();
    await pasoUno(dialogo, 'Argentina\u202E');
    expect(dialogo.find('#viaje-pais-error').text()).toContain(
      'Tiene caracteres que no se pueden usar',
    );
    expect(dialogo.find('#viaje-ciudad-error').exists()).toBe(false);
    await dialogo.find('#viaje-nombre').setValue('\u200b');
    await dialogo.find('form').trigger('submit');
    expect(dialogo.find('#viaje-nombre-error').text()).toContain('Ingresá un nombre');
    expect(crear).not.toHaveBeenCalled();
  });

  it('si la respuesta de crear se pierde, el reintento manda el mismo id', async () => {
    const crear = vi
      .fn()
      .mockRejectedValueOnce(new ErrorDeApi(0, 'SIN_CONEXION', 'No se pudo contactar al servidor'))
      .mockResolvedValueOnce(detalle('ADMIN'));
    const { dialogo } = montar(crear);
    await flushPromises();
    await pasoUno(dialogo);
    await pasoDos(dialogo);
    expect(dialogo.text()).toContain('No se pudo contactar al servidor');
    await dialogo.find('form').trigger('submit');
    await flushPromises();
    expect(dialogo.text()).toContain('Paso 3 de 3');
    const [primero, segundo] = crear.mock.calls.map((c) => (c[0] as { id: string }).id);
    expect(segundo).toBe(primero);
  });

  it('sin país, el destino es solo la ciudad', async () => {
    const { dialogo, crear } = montar();
    await flushPromises();
    await pasoUno(dialogo, '  ');
    await pasoDos(dialogo);
    expect(crear).toHaveBeenCalledWith(expect.objectContaining({ destino: 'Bariloche' }));
  });

  it('en el paso 3 suma viajeros al viaje creado y después lleva al viaje', async () => {
    const { dialogo, agregarViajero } = montar();
    await flushPromises();
    await pasoUno(dialogo);
    await pasoDos(dialogo);
    await dialogo.find('#agregar-email').setValue('tomas@ejemplo.com');
    await dialogo.find('form').trigger('submit');
    await flushPromises();
    expect(agregarViajero).toHaveBeenCalledWith('v1', 'tomas@ejemplo.com');
    expect(dialogo.text()).toContain('Se agregó a tomas@ejemplo.com');

    const ir = dialogo.findAll('button').find((b) => b.text() === 'Ir al viaje')!;
    await ir.trigger('click');
    expect(dialogo.emitted('creado')).toEqual([['v1']]);
  });

  it('limita el nombre, y la ciudad y el país para que el destino no supere los 120', async () => {
    const { dialogo } = montar();
    await flushPromises();
    const largo = (id: string) => Number(dialogo.find(id).attributes('maxlength'));
    expect(largo('#viaje-nombre')).toBe(80);
    // Con la ", " del medio, ciudad y país completos suman exactamente 120.
    expect(largo('#viaje-ciudad') + 2 + largo('#viaje-pais')).toBe(120);
  });

  it('Atrás vuelve al paso 1 conservando lo cargado', async () => {
    const { dialogo } = montar();
    await flushPromises();
    await pasoUno(dialogo);
    await dialogo
      .findAll('button')
      .find((b) => b.text() === 'Atrás')!
      .trigger('click');
    expect(dialogo.text()).toContain('Paso 1 de 3');
    expect((dialogo.find('#viaje-ciudad').element as HTMLInputElement).value).toBe('Bariloche');
  });

  it('si el viaje se creó pero falló abrirlo, reintentar no crea otro igual', async () => {
    const obtener = vi
      .fn()
      .mockRejectedValueOnce(new ErrorDeApi(0, 'SIN_CONEXION', 'No hay conexión'))
      .mockResolvedValue(detalle('ADMIN'));
    const { dialogo, crear } = montar(undefined, obtener);
    await flushPromises();
    await pasoUno(dialogo);
    await pasoDos(dialogo);
    expect(dialogo.text()).toContain('No hay conexión');
    expect(dialogo.text()).toContain('Paso 2 de 3');
    // Con el viaje ya creado, no se vuelve a editar el paso 1.
    expect(dialogo.findAll('button').some((b) => b.text() === 'Atrás')).toBe(false);

    await dialogo.find('form').trigger('submit');
    await flushPromises();
    expect(crear).toHaveBeenCalledTimes(1);
    expect(dialogo.text()).toContain('Paso 3 de 3');
  });

  it('muestra junto a cada campo los errores de validación de la API', async () => {
    const { dialogo } = montar(
      vi.fn(async () => {
        throw new ErrorDeApi(400, 'VALIDACION', 'Datos inválidos', [
          { campo: 'fechaFin', mensaje: 'La fecha de fin no puede ser anterior al inicio' },
        ]);
      }),
    );
    await flushPromises();
    await pasoUno(dialogo);
    await pasoDos(dialogo);
    expect(dialogo.text()).toContain('La fecha de fin no puede ser anterior al inicio');
    expect(dialogo.emitted('creado')).toBeUndefined();
  });

  it('un error de la API en el destino vuelve al paso 1 y se muestra en la ciudad', async () => {
    const { dialogo } = montar(
      vi.fn(async () => {
        throw new ErrorDeApi(400, 'VALIDACION', 'Datos inválidos', [
          { campo: 'destino', mensaje: 'Destino demasiado largo' },
        ]);
      }),
    );
    await flushPromises();
    await pasoUno(dialogo);
    await pasoDos(dialogo);
    expect(dialogo.text()).toContain('Paso 1 de 3');
    expect(dialogo.find('#viaje-ciudad-error').text()).toContain('Destino demasiado largo');
  });
});

describe('DialogoNuevoViaje: validación al salir de cada campo', () => {
  it('avisa al dejar un campo obligatorio vacío y deja de avisar al completarlo', async () => {
    const { dialogo } = montar();
    await flushPromises();
    const nombre = dialogo.find('#viaje-nombre');
    await nombre.trigger('focusout');
    expect(dialogo.text()).toContain('Ingresá un nombre');
    expect(nombre.attributes('aria-invalid')).toBe('true');
    // El texto de ayuda sigue enlazado junto al error.
    expect(nombre.attributes('aria-describedby')).toBe('viaje-nombre-error viaje-nombre-ayuda');
    // Los campos que todavía no se tocaron no muestran error.
    expect(dialogo.text()).not.toContain('Ingresá la ciudad');

    await nombre.setValue('Bariloche 2026');
    expect(dialogo.text()).not.toContain('Ingresá un nombre');
    expect(nombre.attributes('aria-invalid')).toBeUndefined();
  });
});
