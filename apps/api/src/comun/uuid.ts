const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Si el valor tiene formato de UUID, como los identificadores de la base. */
export const esUuid = (valor: string): boolean => UUID.test(valor);
