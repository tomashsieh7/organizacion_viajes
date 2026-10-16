import type { TipoAcceso } from '@viajes/compartido';

export type Rol = 'ADMIN' | 'VIAJERO';

export type EstadoMembresia = 'ACTIVA' | 'ELIMINADA' | 'RETIRADA';

/**
 * RN-E6 (P18): quien participa tiene acceso completo; quien se fue o fue eliminado conserva
 * acceso solo a los saldos mientras le queden saldos pendientes a favor o en contra.
 */
export function tipoDeAcceso(
  estado: EstadoMembresia,
  tieneSaldosPendientes: boolean,
): TipoAcceso | null {
  if (estado === 'ACTIVA') return 'COMPLETO';
  return tieneSaldosPendientes ? 'SOLO_SALDOS' : null;
}

export interface DatosMembresia {
  usuarioId: string;
  rol: Rol;
  estado: EstadoMembresia;
  bajaConDeuda: boolean;
  altaEn: Date;
  bajaEn: Date | null;
}

/** Pertenencia de un usuario a un viaje, con su rol y su estado (P2, P18). */
export class Membresia {
  constructor(private datos: DatosMembresia) {}

  get usuarioId() {
    return this.datos.usuarioId;
  }
  get rol() {
    return this.datos.rol;
  }
  get estado() {
    return this.datos.estado;
  }

  estaActiva(): boolean {
    return this.datos.estado === 'ACTIVA';
  }

  /** RN-E6. */
  tipoDeAcceso(tieneSaldosPendientes: boolean): TipoAcceso | null {
    return tipoDeAcceso(this.datos.estado, tieneSaldosPendientes);
  }

  esAdminActivo(): boolean {
    return this.estaActiva() && this.datos.rol === 'ADMIN';
  }

  /** RN-E3, RN-E4, RN-E7: baja lógica que nunca borra historial y registra si había deuda. */
  darDeBaja(estado: 'ELIMINADA' | 'RETIRADA', conDeuda: boolean, ahora: Date): void {
    this.datos = { ...this.datos, rol: 'VIAJERO', estado, bajaConDeuda: conDeuda, bajaEn: ahora };
  }

  /** RN-E8: volver a agregar a alguien reactiva su misma membresía. */
  reactivar(): void {
    this.datos = {
      ...this.datos,
      rol: 'VIAJERO',
      estado: 'ACTIVA',
      bajaConDeuda: false,
      bajaEn: null,
    };
  }

  cambiarRol(rol: Rol): void {
    this.datos = { ...this.datos, rol };
  }

  aDatos(): DatosMembresia {
    return { ...this.datos };
  }
}
