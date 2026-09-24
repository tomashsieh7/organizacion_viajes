import {
  DenegarOpcionesRestantes,
  SinSuperposicionConConfirmadas,
} from '../../src/modulos/actividades/dominio/politicas.js';
import {
  probarContratoPoliticaResolucionOpciones,
  probarContratoPoliticaSuperposicion,
} from './politicas.contrato.js';

probarContratoPoliticaSuperposicion(
  'sin superposición con confirmadas',
  () => new SinSuperposicionConConfirmadas(),
);
probarContratoPoliticaResolucionOpciones(
  'denegar las opciones restantes',
  () => new DenegarOpcionesRestantes(),
);
