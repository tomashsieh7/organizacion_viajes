import AxeBuilder from '@axe-core/playwright';
import { api, expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

for (const ancho of [390, 1280]) {
  test(`CU27 y CU28: elegir días, conservar noches y ubicar desde Sin día a ${ancho}px`, async ({
    browser,
  }, info) => {
    const ana = await nuevoViajero(browser, 'Ana');
    const tomas = await nuevoViajero(browser, 'Tomás');
    const viajeId = await viajeCon(ana, tomas);
    const ruta = `/viajes/${viajeId}`;
    const { alojamiento } = await api<{ alojamiento: { id: string } }>(
      tomas,
      'POST',
      `${ruta}/alojamientos`,
      {
        nombre: 'Cabaña del lago',
        ubicacion: 'Centro',
        fechaDesde: '2026-12-12',
        fechaHasta: '2026-12-15',
      },
    );
    await api(ana, 'POST', `${ruta}/propuestas/${alojamiento.id}/confirmar`);
    const { actividad } = await api<{ actividad: { id: string } }>(
      tomas,
      'POST',
      `${ruta}/actividades`,
      {
        titulo: 'Kayak',
        ubicacion: 'Lago',
        latitud: -41,
        longitud: -71,
        fecha: '2026-12-15',
        horaInicio: '10:00',
        duracionMin: 120,
      },
    );
    const p = ana.page;
    await p.setViewportSize({ width: ancho, height: 900 });
    await p.goto(`${ruta}/participantes`);
    await p.getByRole('button', { name: 'Editar', exact: true }).click();
    await p.getByLabel('Hasta', { exact: true }).fill('2026-12-13');
    await p.getByRole('button', { name: 'Elegir días', exact: true }).click();
    await expect(p.getByRole('heading', { name: '¿Qué días se quedan?' })).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page: p })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await p.locator('#destino-2026-12-15').selectOption('2026-12-13');
    await p.getByRole('button', { name: 'Revisar cambios' }).click();
    await expect(p.getByText('1 propuesta queda sin día. Podés ubicarla después.')).toBeVisible();
    await p.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(p.getByRole('dialog')).toHaveCount(0);
    const lista = await api<{ actividades: { id: string; actividad: { fecha: string } }[] }>(
      ana,
      'GET',
      `${ruta}/actividades`,
    );
    expect(lista.actividades.find((a) => a.id === actividad.id)!.actividad.fecha).toBe(
      '2026-12-13',
    );
    await p.goto(`${ruta}/resumen`);
    await expect(p.getByText('1 propuesta sin día')).toBeVisible();
    await p.getByRole('link', { name: 'Ubicar', exact: true }).click();
    await expect(p.getByRole('heading', { name: 'Sin día', exact: true })).toBeVisible();
    await expect(p.getByRole('heading', { name: 'Cabaña del lago', exact: true })).toBeVisible();
    await expect(p.getByText('3 noches · Sin día')).toBeVisible();
    // RN-V6: la tercera pestaña no debe partir los nombres de las secciones en celular.
    for (const enlace of await p.locator('nav.subsecciones a').all()) {
      const lineas = await enlace.evaluate((el) => {
        const rango = document.createRange();
        rango.selectNodeContents(el);
        return rango.getClientRects().length;
      });
      expect(lineas).toBe(1);
    }
    const acciones = p.locator('.propuesta .admin');
    await expect(acciones.getByRole('button', { name: 'Ubicar en un día' })).toBeVisible();
    await expect(acciones.getByRole('button', { name: 'Cancelar', exact: true })).toBeVisible();

    expect(
      (
        await new AxeBuilder({ page: p })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await p.screenshot({ path: info.outputPath(`sin-dia-${ancho}.png`), fullPage: true });
    await tomas.page.goto(`${ruta}/sin-dia`);
    await expect(tomas.page.getByRole('heading', { name: 'Cabaña del lago' })).toBeVisible();
    await expect(tomas.page.getByRole('button', { name: 'Ubicar en un día' })).toHaveCount(0);
    await p.getByRole('button', { name: 'Ubicar en un día' }).click();
    await p.getByLabel('Entrada', { exact: true }).fill('2026-12-10');
    expect(
      (
        await new AxeBuilder({ page: p })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await expect(p.getByText(/Salida:.*13 dic.*3 noches/)).toBeVisible();
    await p.getByRole('button', { name: 'Guardar fecha' }).click();
    await expect(p.getByText('No hay propuestas sin día.')).toBeVisible();
    await p.reload();
    await expect(p.getByText('No hay propuestas sin día.')).toBeVisible();
    const actual = await api<{
      alojamientos: {
        estado: string;
        alojamiento: { fechaDesde: string; fechaHasta: string; noches: number };
      }[];
    }>(ana, 'GET', `${ruta}/alojamientos`);
    expect(actual.alojamientos[0]).toMatchObject({
      estado: 'CONFIRMADA',
      alojamiento: { fechaDesde: '2026-12-10', fechaHasta: '2026-12-13', noches: 3 },
    });
  });
}
