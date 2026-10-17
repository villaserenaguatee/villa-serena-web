import { test, expect, login, calendarRegion, viewports } from './reception-fixtures';
import { writeFile } from 'node:fs/promises';

for (const { name, viewport } of [...viewports, { name: 'móvil horizontal', viewport: { width: 844, height: 390 } }]) {
  test.describe(name, () => {
    test.use({ viewport });
    test('encabezado alineado, modal, scroll interno y encabezados/primera columna fijos', async ({ page }, testInfo) => {
      await login(page); const calendar = calendarRegion(page);
      await expect(page.getByText('Datos de prueba · reservas nuevas mediante el BFF', { exact: true })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Cuenta, check-out y factura', exact: true })).toHaveAttribute('href', '/panel/recepcion/cuenta');
      const navigation = calendar.getByRole('group', { name: 'Navegación del calendario' });
      for (const view of ['Mes', 'Habitaciones']) {
        await calendar.getByRole('button', { name: view, exact: true }).click();
        const period = navigation.locator('p[aria-live]'); const current = await period.innerText();
        await navigation.getByRole('button', { name: 'Período siguiente' }).click(); await expect(period).not.toHaveText(current);
        await navigation.getByRole('button', { name: 'Período anterior' }).click(); await expect(period).toHaveText(current);
        const positions = await navigation.locator('button, p').evaluateAll(elements => elements.map(el => {
          const r = el.getBoundingClientRect(); return { x: r.x, y: r.y + r.height / 2 };
        }));
        expect(positions.every((p, i) => !i || (p.x > positions[i - 1].x && Math.abs(p.y - positions[0].y) < 2))).toBe(true);
      }
      await expect(calendar.getByRole('button', { name: 'Hoy', exact: true })).toHaveCount(0);
      const button = calendar.getByRole('button', { name: '+ Nueva reserva', exact: true });
      const newBox = await button.boundingBox(); const selectorBox = await calendar.getByRole('group', { name: 'Vista del calendario' }).boundingBox();
      expect(newBox).not.toBeNull(); expect(selectorBox).not.toBeNull();
      expect(Math.abs(selectorBox!.x + selectorBox!.width - newBox!.x - newBox!.width)).toBeLessThan(2);
      await writeFile(testInfo.outputPath('header.json'), JSON.stringify({ newBox, selectorBox,
        navigation: await navigation.boundingBox(), floor: await calendar.getByLabel('Piso del calendario').boundingBox(), category: await calendar.getByLabel('Categoría del calendario').boundingBox() }));
      await button.click(); const modal = page.getByRole('dialog', { name: 'Nueva reserva' });
      await expect(modal).toBeVisible(); await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(modal).toHaveCount(0);
      await calendar.getByRole('button', { name: 'Habitaciones', exact: true }).click();
      const area = calendar.getByRole('table', { name: 'Reservas por habitación y día' }).locator('..');
      await expect(area.locator('tbody th[scope="row"]').first()).toBeVisible();
      const geometry = await area.evaluate(el => {
        const header = el.querySelector('thead th:nth-child(2)')!, corner = el.querySelector('thead th')!, room = el.querySelector('tbody th[scope="row"]')!;
        const before = { top: header.getBoundingClientRect().top, left: room.getBoundingClientRect().left, corner: corner.getBoundingClientRect().left };
        el.scrollTop = 200; el.scrollLeft = 350;
        return { before, after: { top: header.getBoundingClientRect().top, left: room.getBoundingClientRect().left, corner: corner.getBoundingClientRect().left },
          vertical: el.scrollTop, horizontal: el.scrollLeft, height: el.clientHeight, controlsInside: Boolean(el.querySelector('select')) };
      });
      expect(geometry.vertical).toBeGreaterThan(0); expect(geometry.horizontal).toBeGreaterThan(0);
      for (const key of ['top', 'left', 'corner'] as const) expect(Math.abs(geometry.before[key] - geometry.after[key])).toBeLessThan(2);
      expect(geometry.controlsInside).toBe(false); expect(geometry.height).toBeLessThanOrEqual(640);
      await writeFile(testInfo.outputPath('scroll.json'), JSON.stringify(geometry));
      await page.screenshot({ path: testInfo.outputPath('scroll.png') });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    });
  });
}
