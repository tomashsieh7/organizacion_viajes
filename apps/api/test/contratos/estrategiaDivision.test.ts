import { repartirEnPartesIguales } from '@viajes/compartido';
import { DivisionArbitraria } from '../../src/modulos/gastos/dominio/divisionArbitraria.js';
import { DivisionEnPartesIguales } from '../../src/modulos/gastos/dominio/divisionEnPartesIguales.js';
import { probarContratoEstrategiaDivision } from './estrategiaDivision.contrato.js';

probarContratoEstrategiaDivision('partes iguales', () => new DivisionEnPartesIguales());

// Para la arbitraria, un reparto válido cualquiera: el último deudor absorbe el resto.
probarContratoEstrategiaDivision('arbitraria', (total, deudores) => {
  const montos = repartirEnPartesIguales(total, deudores.length).reverse();
  return new DivisionArbitraria(new Map(deudores.map((d, i) => [d, montos[i]!])));
});
