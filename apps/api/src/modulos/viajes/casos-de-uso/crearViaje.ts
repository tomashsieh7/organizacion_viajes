import { randomUUID } from 'node:crypto';
import type { DatosViajeNuevo } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { ConsultaViajes } from '../dominio/puertos.js';
import { Viaje } from '../dominio/viaje.js';
import type { DependenciasViajes } from './dependencias.js';

/** CU01. */
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
      id: randomUUID(),
      nombre: datos.nombre,
      destino: datos.destino,
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin,
      monedaCodigo: datos.monedaCodigo,
      creadorId,
      ahora: this.deps.reloj.ahora(),
    });
    await this.deps.unidad.ejecutar((repos) => repos.viajes.guardar(viaje));
    return viaje.id;
  }
}
