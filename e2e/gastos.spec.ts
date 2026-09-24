import { expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

test('CU20, CU21 y CU23: anotar un gasto con división arbitraria y pagar parte de la deuda', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const viajeId = await viajeCon(ana, tomas);

  const p = ana.page;
  await p.goto(`/viajes/${viajeId}/gastos/nuevo`);
  await p.fill('#gasto-titulo', 'Alquiler de auto');
  await p.selectOption('#gasto-categoria', { label: 'Transporte' });
  await p.fill('#gasto-monto', '1000');
  await p.getByRole('button', { name: 'Seleccionar a todos' }).click();
  await p.getByLabel('Indico cuánto paga cada uno').check();
  await p.getByLabel('Monto de Ana').fill('400');
  await p.getByLabel('Monto de Tomás').fill('500');
  await expect(p.locator('.diferencia')).toContainText('Falta asignar');
  await p.getByLabel('Monto de Tomás').fill('600');
  await expect(p.locator('.diferencia')).toHaveAttribute('data-cuadra', 'true');
  await p.getByRole('button', { name: 'Guardar' }).click();
  await expect(p).toHaveURL(new RegExp(`/viajes/${viajeId}/gastos$`));
  await expect(p.locator('article', { hasText: 'Alquiler de auto' })).toContainText(
    'Tomás: $ 600,00',
  );

  const t = tomas.page;
  await t.goto(`/viajes/${viajeId}/saldos`);
  const fila = t.locator('.fila-saldo', { hasText: 'Ana' });
  await expect(fila).toContainText('$ 600,00');
  await fila.getByRole('link', { name: 'Pagar' }).click();
  await expect(t.locator('.saldo')).toContainText('Le debés $ 600,00 a Ana');
  await t.fill('#pago-monto', '700');
  await expect(t.getByRole('alert')).toContainText('El monto supera lo que debés');
  await t.fill('#pago-monto', '250');
  await t.getByRole('button', { name: 'Pagar', exact: true }).click();
  await expect(t).toHaveURL(new RegExp(`/viajes/${viajeId}/saldos$`));
  await expect(t.getByRole('status')).toContainText('Todavía le debés $ 350,00 a Ana');

  await p.goto(`/viajes/${viajeId}/saldos`);
  await p.getByRole('tab', { name: /Me deben/ }).click();
  const deTomas = p.locator('.fila-saldo', { hasText: 'Tomás' });
  await expect(deTomas).toContainText('$ 350,00');
  await deTomas.getByText('Pagos (1)').click();
  await expect(deTomas).toContainText('$ 250,00 · registrado por Tomás');
});
