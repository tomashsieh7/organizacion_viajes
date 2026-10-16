/** RN-E6: deudas con saldo pendiente en las que el usuario es deudor o acreedor. */
export const saldosPendientesDe = (usuarioId: string) => ({
  monto: { gt: 0 },
  OR: [{ deudorId: usuarioId }, { acreedorId: usuarioId }],
});
