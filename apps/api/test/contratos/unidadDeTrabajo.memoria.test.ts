import { UnidadDeTrabajoEnMemoria } from '../soporte/unidadDeTrabajoEnMemoria.js';
import {
  probarContratoUnidadDeTrabajo,
  type RepositorioDeNotas,
} from './unidadDeTrabajo.contrato.js';

interface Estado {
  notas: string[];
}

probarContratoUnidadDeTrabajo('en memoria', {
  async crear() {
    const unidad = new UnidadDeTrabajoEnMemoria<Estado, RepositorioDeNotas>(
      { notas: [] },
      (estado) => ({
        agregar: async (texto) => {
          estado.notas.push(texto);
        },
        listar: async () => [...estado.notas],
      }),
    );
    return { unidad, leerConfirmado: async () => unidad.confirmado.notas };
  },
});
