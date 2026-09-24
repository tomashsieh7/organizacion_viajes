/**
 * Reparte un monto entero en `partes` porciones que suman exactamente el total. Las unidades que
 * sobran se asignan de a una a las primeras porciones (P13, D16): 1000 en 3 da 334, 333 y 333.
 * La usan la API para dividir los gastos y la web para mostrar la división antes de guardar.
 */
export function repartirEnPartesIguales(total: number, partes: number): number[] {
  const base = Math.floor(total / partes);
  const resto = total - base * partes;
  return Array.from({ length: partes }, (_, i) => base + (i < resto ? 1 : 0));
}
