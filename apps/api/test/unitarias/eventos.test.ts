import { describe, expect, it } from 'vitest';
import { BusDeEventosEnMemoria, type EventoDeDominio } from '../../src/compartido/eventos.js';

interface Saludo extends EventoDeDominio {
  tipo: 'saludo';
  nombre: string;
}

describe('BusDeEventosEnMemoria', () => {
  it('entrega el evento a todos los suscriptores de su tipo, en orden', async () => {
    const bus = new BusDeEventosEnMemoria();
    const recibidos: string[] = [];
    bus.suscribir<Saludo>('saludo', (e) => void recibidos.push(`1:${e.nombre}`));
    bus.suscribir<Saludo>('saludo', async (e) => void recibidos.push(`2:${e.nombre}`));
    await bus.publicar({ tipo: 'saludo', nombre: 'Ana' } as Saludo);
    expect(recibidos).toEqual(['1:Ana', '2:Ana']);
  });

  it('no entrega eventos de otros tipos y publicar sin suscriptores no falla', async () => {
    const bus = new BusDeEventosEnMemoria();
    const recibidos: unknown[] = [];
    bus.suscribir('otro', (e) => void recibidos.push(e));
    await bus.publicar({ tipo: 'saludo' });
    expect(recibidos).toEqual([]);
  });
});
