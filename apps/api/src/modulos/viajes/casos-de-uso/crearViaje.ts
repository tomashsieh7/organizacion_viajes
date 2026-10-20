import { randomUUID } from 'node:crypto';
import type { DatosViajeNuevo } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { ConsultaViajes } from '../dominio/puertos.js';
import { Viaje } from '../dominio/viaje.js';
import type { DependenciasViajes } from './dependencias.js';

/** CU01. Si el mismo formulario reintenta, devuelve el viaje que ya creó. */
export class CrearViaje {
  constructor(
    private readonly deps: DependenciasViajes,
    private readonly consultas: Pick<ConsultaViajes, 'existeMoneda'>,
  ) {}

  async ejecutar(creadorId: string, datos: DatosViajeNuevo): Promise<string> {
    if (!(await this.consultas.existeMoneda(datos.monedaCodigo))) {
      throw new ErrorDeDominio(
        'REGLA_DE_NEGOCIO',
        'MONEDA_INEXISTENTE',
        'La moneda elegida no existe',
      );
    }
    const viaje = Viaje.crear({
      id: datos.id ?? randomUUID(),
      nombre: datos.nombre,
      destino: datos.destino,
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin,
      monedaCodigo: datos.monedaCodigo,
      creadorId,
      ahora: this.deps.reloj.ahora(),
    });
    await this.deps.unidad.ejecutar(async (repos) => {
      // Un reintento del mismo formulario trae el mismo id: el viaje ya existe y no se duplica.
      // Con el id de un viaje ajeno no se toca nada, porque guardar lo sobrescribiría.
      const existente = await repos.viajes.obtenerParaModificar(viaje.id);
      if (existente?.creadoPorId === creadorId) return;
      if (existente) {
        throw new ErrorDeDominio('CONFLICTO', 'VIAJE_EXISTENTE', 'Ya existe un viaje con ese id');
      }
      await repos.viajes.guardar(viaje);
    });
    return viaje.id;
  }
}
