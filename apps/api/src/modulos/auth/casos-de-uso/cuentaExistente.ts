import { ErrorDeDominio } from '../../../comun/errores.js';
import type { Cuenta, RepositorioCuentas } from '../dominio/puertos.js';

export async function cuentaExistente(
  cuentas: RepositorioCuentas,
  usuarioId: string,
): Promise<Cuenta> {
  const cuenta = await cuentas.obtener(usuarioId);
  if (!cuenta)
    throw new ErrorDeDominio('NO_AUTENTICADO', 'NO_AUTENTICADO', 'Tenés que iniciar sesión');
  return cuenta;
}
