import type { ClientePrisma } from '../../../compartido/infraestructura/prisma.js';
import type { BuscadorDeUsuarios } from '../../viajes/dominio/puertos.js';
import { normalizarEmail } from '../dominio/emailContrasena.js';

/** Implementa la búsqueda que necesita el módulo de viajes a partir de las credenciales (D7). */
export class BuscadorDeUsuariosPrisma implements BuscadorDeUsuarios {
  constructor(private readonly db: ClientePrisma) {}

  async buscarPorIdentificador(tipo: 'EMAIL_CONTRASENA', valor: string): Promise<string | null> {
    const identificador = tipo === 'EMAIL_CONTRASENA' ? normalizarEmail(valor) : valor;
    const c = await this.db.credencial.findUnique({
      where: { tipo_identificador: { tipo, identificador } },
    });
    return c?.usuarioId ?? null;
  }
}
