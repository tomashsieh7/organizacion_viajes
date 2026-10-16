import type { CategoriaGasto } from '@viajes/compartido';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import type { ConsultaCategorias } from '../dominio/puertos.js';

export class ConsultaCategoriasPrisma implements ConsultaCategorias {
  constructor(private readonly db: ClientePrisma) {}

  listar(): Promise<CategoriaGasto[]> {
    return this.db.categoriaGasto.findMany({ orderBy: { nombre: 'asc' } });
  }

  async existe(categoriaId: string): Promise<boolean> {
    return (await this.db.categoriaGasto.count({ where: { id: categoriaId } })) > 0;
  }
}
