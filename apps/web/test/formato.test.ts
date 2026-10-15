import { describe, expect, it } from 'vitest';
import {
  aUnidadMinima,
  formatearDia,
  etiquetaDelDia,
  formatearHora,
  formatearMonto,
  formatearRango,
  monedaSegunCodigo,
  simboloMoneda,
  textoEscribiendo,
  textoNovedad,
} from '../src/utiles/formato';

describe('aUnidadMinima', () => {
  it('interpreta montos escritos en castellano', () => {
    expect(aUnidadMinima('48000', 2)).toBe(4_800_000);
    expect(aUnidadMinima('48000,5', 2)).toBe(4_800_050);
    expect(aUnidadMinima('48.000,50', 2)).toBe(4_800_050);
    expect(aUnidadMinima('48.000', 2)).toBe(4_800_000);
    expect(aUnidadMinima('48.5', 2)).toBe(4_850);
    expect(aUnidadMinima('1500', 0)).toBe(1500);
  });

  it('rechaza textos que no son montos o con más decimales que la moneda', () => {
    for (const t of ['', 'abc', '-5', '1,234', '10,5']) {
      expect(aUnidadMinima(t, t === '10,5' ? 0 : 2)).toBeNull();
    }
  });

  it('formatea según los decimales de la moneda', () => {
    expect(formatearMonto(150_000, { codigo: 'ARS', nombre: '', decimales: 2 })).toMatch(
      /\$\s?1\.500,00/,
    );
    expect(formatearMonto(1500, { codigo: 'CLP', nombre: '', decimales: 0 })).toMatch(/1\.500/);
  });
});

describe('formatearRango', () => {
  it('no repite el mes ni el año cuando coinciden', () => {
    expect(formatearRango('2026-12-10', '2026-12-16')).toBe('10 al 16 dic 2026');
    expect(formatearRango('2026-11-28', '2026-12-03')).toBe('28 nov al 3 dic 2026');
    expect(formatearRango('2026-12-28', '2027-01-03')).toBe('28 dic 2026 al 3 ene 2027');
  });
});

describe('formatearDia', () => {
  it('muestra el día de un instante con el mes abreviado, como los rangos', () => {
    // Mediodía UTC: es el mismo día en casi cualquier zona horaria del dispositivo.
    expect(formatearDia('2026-10-14T12:00:00.000Z')).toBe('14 oct 2026');
    expect(formatearDia('2027-01-03T12:00:00.000Z')).toBe('3 ene 2027');
  });
});

describe('formatearHora y etiquetaDelDia', () => {
  const ahora = new Date(2026, 9, 15, 10, 0);
  const en = (dia: number, mes: number, anio = 2026) =>
    new Date(anio, mes, dia, 21, 26).toISOString();

  it('la hora va con 24 horas', () => {
    expect(formatearHora(en(24, 8))).toBe('21:26');
    expect(formatearHora(new Date(2026, 11, 3, 9, 5).toISOString())).toBe('09:05');
  });

  it('el día dice Hoy, Ayer, la fecha corta o la fecha con año', () => {
    expect(etiquetaDelDia(en(15, 9), ahora)).toBe('Hoy');
    expect(etiquetaDelDia(en(14, 9), ahora)).toBe('Ayer');
    expect(etiquetaDelDia(en(24, 8), ahora)).toBe('24 sep');
    expect(etiquetaDelDia(en(30, 11, 2025), ahora)).toBe('30 dic 2025');
  });
});

describe('simboloMoneda', () => {
  it('usa el mismo símbolo que los montos formateados', () => {
    expect(simboloMoneda({ codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 })).toBe('$');
    expect(simboloMoneda({ codigo: 'USD', nombre: 'Dólar', decimales: 2 })).toBe('US$');
  });
});

describe('textoNovedad', () => {
  const ana = { id: 'ana', nombre: 'Ana', apodo: 'Ani' };
  const tomas = { id: 'tomas', nombre: 'Tomás', apodo: null };
  const base = { texto: '', monto: null, contraparte: null, en: '2026-10-14T12:00:00Z' };
  const texto = (n: Partial<Parameters<typeof textoNovedad>[0]>, miId = 'ana') =>
    textoNovedad({ tipo: 'MENSAJE', autor: tomas, ...base, ...n }, miId, 'ARS').replace(/\s/g, ' ');

  it('arma la línea según el tipo, en segunda persona si lo hizo quien mira', () => {
    expect(texto({ texto: 'Hola' })).toBe('Tomás: Hola');
    expect(texto({ autor: ana, texto: 'Dale' })).toBe('Vos: Dale');
    expect(texto({ tipo: 'PROPUESTA', texto: 'Kayak' })).toBe('Tomás propuso «Kayak»');
    expect(texto({ tipo: 'PROPUESTA', autor: ana, texto: 'Kayak' })).toBe('Propusiste «Kayak»');
    expect(texto({ tipo: 'CONFIRMACION', autor: ana, texto: 'Kayak' })).toBe('Confirmaste «Kayak»');
    expect(texto({ tipo: 'CONFIRMACION', texto: 'Kayak' })).toBe('Tomás confirmó «Kayak»');
    expect(texto({ tipo: 'CONFIRMACION', autor: null, texto: 'Kayak' })).toBe(
      'Se confirmó «Kayak»',
    );
    expect(texto({ tipo: 'GASTO', texto: 'Cena', monto: 1_200_000 })).toBe(
      'Tomás anotó «Cena» · $ 12.000,00',
    );
    expect(texto({ tipo: 'GASTO', autor: ana, texto: 'Cena', monto: 50 })).toBe(
      'Anotaste «Cena» · $ 0,50',
    );
  });

  it('un pago dice quién le pagó a quién', () => {
    const pago = { tipo: 'PAGO' as const, monto: 40_000 };
    expect(texto({ ...pago, autor: tomas, contraparte: ana })).toBe('Tomás te pagó $ 400,00');
    expect(texto({ ...pago, autor: ana, contraparte: tomas })).toBe('Le pagaste $ 400,00 a Tomás');
  });
});

describe('monedaSegunCodigo', () => {
  it('usa los decimales de cada moneda', () => {
    expect(monedaSegunCodigo('ARS').decimales).toBe(2);
    expect(monedaSegunCodigo('CLP').decimales).toBe(0);
  });
});

describe('textoEscribiendo', () => {
  const p = (nombre: string) => ({ id: nombre, nombre, apodo: null });

  it('nombra hasta dos personas y después resume', () => {
    expect(textoEscribiendo([])).toBe('');
    expect(textoEscribiendo([p('Tomás')])).toBe('Tomás está escribiendo…');
    expect(textoEscribiendo([p('Tomás'), p('Ana')])).toBe('Tomás y Ana están escribiendo…');
    expect(textoEscribiendo([p('Tomás'), p('Ana'), p('Luis')])).toBe(
      'Varias personas están escribiendo…',
    );
  });
});
