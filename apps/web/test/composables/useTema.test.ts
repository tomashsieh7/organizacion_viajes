import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLAVE_TEMA, useTema } from '../../src/composables/useTema';

/** Sistema falso: `cambiar` simula que el sistema operativo pasa a claro u oscuro. */
function sistemaFalso(oscuro: boolean) {
  const oyentes = new Set<() => void>();
  const consulta = {
    matches: oscuro,
    addEventListener: (_: string, f: () => void) => oyentes.add(f),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => consulta),
  );
  return {
    cambiar(valor: boolean) {
      consulta.matches = valor;
      oyentes.forEach((f) => f());
    },
  };
}

const tema = () => document.documentElement.dataset['tema'];

describe('useTema', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('sin elección guardada sigue al sistema, también si cambia con la app abierta', () => {
    const sistema = sistemaFalso(true);
    const { iniciar, preferencia } = useTema();
    iniciar();
    expect(preferencia.value).toBe('automatico');
    expect(tema()).toBe('oscuro');
    sistema.cambiar(false);
    expect(tema()).toBe('claro');
  });

  it('la elección manual gana sobre el sistema y queda guardada en el dispositivo', () => {
    const sistema = sistemaFalso(true);
    const { iniciar, elegir } = useTema();
    iniciar();
    elegir('claro');
    expect(tema()).toBe('claro');
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('claro');
    sistema.cambiar(true);
    expect(tema()).toBe('claro');
    elegir('oscuro');
    sistema.cambiar(false);
    expect(tema()).toBe('oscuro');
  });

  it('al volver a abrir la app usa lo guardado, e ignora un valor desconocido', () => {
    sistemaFalso(false);
    localStorage.setItem(CLAVE_TEMA, 'oscuro');
    const { iniciar, preferencia } = useTema();
    iniciar();
    expect(preferencia.value).toBe('oscuro');
    expect(tema()).toBe('oscuro');
    localStorage.setItem(CLAVE_TEMA, '<script>');
    iniciar();
    expect(preferencia.value).toBe('automatico');
    expect(tema()).toBe('claro');
  });

  it('lo elegido en otra pestaña se aplica también en esta', () => {
    sistemaFalso(false);
    const { iniciar, preferencia } = useTema();
    iniciar();
    localStorage.setItem(CLAVE_TEMA, 'oscuro');
    window.dispatchEvent(new StorageEvent('storage', { key: CLAVE_TEMA }));
    expect(preferencia.value).toBe('oscuro');
    expect(tema()).toBe('oscuro');
    localStorage.setItem('otra', 'x');
    localStorage.setItem(CLAVE_TEMA, 'claro');
    window.dispatchEvent(new StorageEvent('storage', { key: 'otra' }));
    expect(tema()).toBe('oscuro');
  });

  it('sin acceso al almacenamiento sigue al sistema y el cambio vale hasta recargar', () => {
    sistemaFalso(true);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const { iniciar, elegir } = useTema();
    iniciar();
    expect(tema()).toBe('oscuro');
    elegir('claro');
    expect(tema()).toBe('claro');
    vi.restoreAllMocks();
  });
});
