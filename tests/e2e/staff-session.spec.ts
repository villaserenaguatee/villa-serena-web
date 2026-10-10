import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, correo: string) {
  await page.goto('/panel/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill('VillaSerena26');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
}

test('sesión demo: acceso por rol, cookies, renovación, Origin, cierre y contraseña temporal', async ({ page, context, baseURL }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));

  await test.step('inicio público y rutas privadas sin sesión', async () => {
    await page.goto('/'); await expect(page).toHaveURL(`${baseURL}/`);
    for (const path of ['/panel', '/recepcion/reservas']) {
      await page.goto(path); await expect(page).toHaveURL(/\/panel\/login$/);
    }
  });
  await test.step('recepción entra directamente al calendario y conserva sesión al recargar', async () => {
    await login(page, 'recepcion@villaserena.gt');
    await expect(page).toHaveURL(`${baseURL}/recepcion`);
    await expect(page.getByRole('heading', { name: 'Calendario de reservas', exact: true })).toBeVisible();
    const cookies = (await context.cookies()).filter(cookie => cookie.name.startsWith('vs_staff_'));
    expect(cookies).toHaveLength(2);
    expect(cookies.every(cookie => cookie.httpOnly && cookie.sameSite === 'Lax' && cookie.path === '/')).toBe(true);
    expect(await page.evaluate(() => document.cookie.includes('vs_staff_'))).toBe(false);
    expect(await page.evaluate(() => localStorage.getItem('villa-serena-session'))).toBeNull();
    const yo = await context.request.get('/api/auth/yo'); expect(yo.status()).toBe(200);
    expect(Object.keys(await yo.json()).sort()).toEqual(['area', 'correo', 'debeCambiarContrasena', 'id', 'nombre', 'rol']);
    await page.reload(); await expect(page.getByRole('heading', { name: 'Calendario de reservas', exact: true })).toBeVisible();
    for (const path of ['/admin', '/panel/admin/canal-simulado']) {
      await page.goto(path); await expect(page.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible();
    }
  });
  await test.step('renovación rotativa y rechazo de refresh reutilizado', async () => {
    const oldRefresh = (await context.cookies()).find(cookie => cookie.name === 'vs_staff_refresh');
    expect(oldRefresh).toBeDefined();
    await context.clearCookies({ name: 'vs_staff_access' });
    await page.goto('/panel'); await expect(page).toHaveURL(`${baseURL}/recepcion`);
    expect((await context.cookies()).find(cookie => cookie.name === 'vs_staff_refresh')?.value).not.toBe(oldRefresh!.value);
    const forged = await context.request.get('/api/auth/yo', { headers: { Cookie: `vs_staff_refresh=${oldRefresh!.value}` } });
    expect(forged.status()).toBe(401);
    await login(page, 'recepcion@villaserena.gt'); await expect(page).toHaveURL(`${baseURL}/recepcion`);
  });
  await test.step('Origin ajeno o ausente y rutas no permitidas', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const response = await context.request.fetch('/api/auth/login', { method, headers: { Origin: 'https://ajeno.example' }, data: {} });
      expect(response.status()).toBe(403);
    }
    expect((await context.request.post('/api/auth/login', { data: {} })).status()).toBe(403);
    for (const path of ['pagos/stripe/webhook', 'canal/reservas', 'auth/renovar']) {
      expect((await context.request.post(`/api/${path}`, { headers: { Origin: baseURL! }, data: {} })).status()).toBe(403);
    }
  });
  await test.step('cierre elimina cookies y protege el panel', async () => {
    await page.goto('/panel/cambiar-contrasena');
    await expect(page.getByRole('navigation', { name: 'Menú de mi rol' }).getByRole('link')).toHaveText(['Calendario', 'Reservas', 'Habitaciones']);
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await expect(page).toHaveURL(/\/panel\/login$/);
    expect((await context.cookies()).filter(cookie => cookie.name.startsWith('vs_staff_'))).toHaveLength(0);
    await page.goto('/panel'); await expect(page).toHaveURL(/\/panel\/login$/);
  });
  await test.step('temporal bloquea rutas y API hasta cambiar contraseña', async () => {
    await login(page, 'temporal@villaserena.gt'); await expect(page).toHaveURL(/\/panel\/cambiar-contrasena$/);
    await page.goto('/recepcion'); await expect(page).toHaveURL(/\/panel\/cambiar-contrasena$/);
    const blocked = await context.request.get('/api/reservas'); expect(blocked.status()).toBe(403);
    expect((await blocked.json()).codigo).toBe('CONTRASENA_TEMPORAL');
    await page.getByLabel('Contraseña actual', { exact: true }).fill('VillaSerena26');
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('NuevaClave123');
    await page.getByLabel('Confirmar nueva contraseña', { exact: true }).fill('distinta');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByText('La confirmación no coincide con la nueva contraseña.', { exact: true })).toBeVisible();
    await page.getByLabel('Confirmar nueva contraseña', { exact: true }).fill('NuevaClave123');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByRole('heading', { name: 'Calendario de reservas', exact: true })).toBeVisible();
  });
  await test.step('cada rol llega a su módulo y conserva sus enlaces autorizados', async () => {
    for (const [correo, home, links] of [
      ['admin@villaserena.gt', '/admin', ['Canal simulado']],
      ['roomservice@villaserena.gt', '/room-service', ['Pedidos', 'Menú']],
      ['limpieza@villaserena.gt', '/limpieza', ['Limpieza', 'Solicitudes', 'Incidencias']],
      ['mantenimiento@villaserena.gt', '/mantenimiento', ['Incidencias']],
      ['ambas@villaserena.gt', '/limpieza', ['Limpieza', 'Solicitudes', 'Incidencias']],
    ] as const) {
      await login(page, correo); await expect(page).toHaveURL(`${baseURL}${home}`);
      await page.goto('/panel/cambiar-contrasena');
      await expect(page.getByRole('navigation', { name: 'Menú de mi rol' }).getByRole('link')).toHaveText([...links]);
    }
  });
  expect(errors).toEqual([]);
});
