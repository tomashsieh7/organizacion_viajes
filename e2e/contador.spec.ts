import AxeBuilder from '@axe-core/playwright';
import { api, expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

for (const ancho of [390, 1280]) {
  test(`contador: urgencia gradual, listo y cancelación a ${ancho}px`, async ({
    browser,
  }, info) => {
    const ana = await nuevoViajero(browser, 'Ana');
    const viaje = await viajeCon(ana);
    const p = ana.page;
    await p.setViewportSize({ width: ancho, height: 900 });
    const ruta = `/viajes/${viaje}`;
    // Solo se fija el reloj del navegador: la preparación usa la API real.
    await p.clock.setFixedTime(new Date('2026-12-04T12:00:00-03:00'));
    await p.goto(`${ruta}/alojamientos`);
    const contador = p.locator('.contador');
    await expect(contador).toHaveAttribute('data-tono', 'urgencia-5');
    await expect(contador).toContainText('6 noches sin lugar');
    await api(ana, 'POST', `${ruta}/alojamientos`, {
      nombre: 'Toda la estadía',
      ubicacion: 'Centro',
      fechaDesde: '2026-12-10',
      fechaHasta: '2026-12-16',
    });
    await p.reload();
    await expect(contador).toContainText('1 por resolver');
    await p.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(contador).toHaveAttribute('data-tono', 'listo');
    await expect(contador).toContainText('Todo listo');
    for (const tema of ['claro', 'oscuro']) {
      await p.evaluate((t) => {
        document.documentElement.dataset['tema'] = t;
      }, tema);
      expect(
        (
          await new AxeBuilder({ page: p })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      await p.screenshot({ path: info.outputPath(`listo-${ancho}-${tema}.png`), fullPage: true });
    }
    await p.goto('/viajes');
    const tarjeta = p.locator('.tarjeta', { hasText: 'Bariloche' });
    await expect(tarjeta.locator('.contador')).toHaveAttribute('data-tono', 'listo');
    await p.goto(`${ruta}/alojamientos`);
    await p.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await p.getByRole('button', { name: 'Sí, cancelar' }).click();
    await expect(contador).toHaveAttribute('data-tono', 'urgencia-5');
    for (const [hoy, tono] of [
      ['2026-11-10', 'urgencia-0'],
      ['2026-11-15', 'urgencia-1'],
      ['2026-11-19', 'urgencia-2'],
      ['2026-11-24', 'urgencia-3'],
      ['2026-11-28', 'urgencia-4'],
      ['2026-12-04', 'urgencia-5'],
      ['2026-12-07', 'urgencia-6'],
    ]) {
      await p.clock.setFixedTime(new Date(`${hoy}T12:00:00-03:00`));
      await p.reload();
      await expect(contador).toHaveAttribute('data-tono', tono!);
      for (const tema of ['claro', 'oscuro']) {
        await p.evaluate((t) => {
          document.documentElement.dataset['tema'] = t;
        }, tema);
        expect(
          (
            await new AxeBuilder({ page: p })
              .include('.contador')
              .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
              .analyze()
          ).violations,
        ).toEqual([]);
      }
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await contador.screenshot({ path: info.outputPath(`${tono}-${ancho}.png`) });
    }
  });
}
