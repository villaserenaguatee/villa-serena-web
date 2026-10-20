import { test, expect, viewports, hotelDate, verifyBookingEmail, expectNoOverflow } from './public-fixtures';

for (const { name, viewport } of viewports) test.describe(name, () => {
  test.use({ viewport });
  for (const path of ['/privacidad', '/terminos']) test(`direct legal visit ${path}: back, logo, contact and reload`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('console', message => { if (message.type() === 'error' && /\/(privacidad|terminos)(\?|$)/.test(page.url())) errors.push(message.text()+' '+message.location().url); });
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    const back = page.getByRole('button', { name: 'Volver', exact: true });
    await expect(back.locator('svg')).toHaveAttribute('width', '24');
    await expect(back.locator('svg')).toHaveAttribute('height', '24');
    expect(await back.evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(44);
    await expectNoOverflow(page);
    // Check the mail action without opening a native mail client or sending mail.
    const contact = page.locator('article a');
    await expect(contact).toHaveCount(1);
    await expect(contact).toHaveAttribute('href', 'mailto:hotelvillaserena.gt@gmail.com');
    await contact.evaluate(el => el.addEventListener('click', event => event.preventDefault(), { once: true }));
    await contact.click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await page.reload();
    await page.screenshot({ path: info.outputPath('legal.png'), fullPage: true });
    await back.focus(); await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/$/);
    await page.goto(path);
    await page.getByRole('link', { name: 'Villa Serena Hotel', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await info.attach('console-legal.json',{body:JSON.stringify(errors,null,2),contentType:'application/json'});
    expect(errors.filter(error=>!error.includes('ERR_NETWORK_ACCESS_DENIED')&&!(error.includes('401 (Unauthorized)')&&error.includes('/api/auth/yo')))).toEqual([]);
  });

  for (const [button, path] of [['condiciones de reserva y cancelación', '/terminos'], ['política de privacidad', '/privacidad']]) test('checkout returns to the same payment draft: '+path, async ({ page }, info) => {
    await page.goto('/');
    const draft = await page.evaluate(({ arrival, departure }) => {
      const id = crypto.randomUUID();
      sessionStorage.setItem('vs-public-booking-draft', JSON.stringify({ id, createdAt: Date.now(), params: new URLSearchParams({ slug: 'habitacion-estandar', tipoHabitacionId: '1', llegada: arrival, salida: departure, adultos: '2', ninos: '0', nombre: 'Legal', apellidos: 'Navigation', correo: 'legal@example.test', telefono: '+502 55555555', tipoDocumento: 'DPI', documento: '1234567890123' }).toString() }));
      return id;
    }, { arrival: hotelDate(14), departure: hotelDate(16) });
    await page.goto('/reservar/verificar?draft=' + draft); await verifyBookingEmail(page);
    await page.locator('.terms-check input').check();
    await expect(page.getByRole('button',{name:'Continuar pago',exact:true})).toBeEnabled();
    await page.locator('.terms-check input').uncheck();
    const payment = page.url();
    const saved = await page.evaluate(() => sessionStorage.getItem('vs-public-booking-draft'));
    const mutations: string[] = [], errors: string[] = [];
    page.on('request', request => { if (request.method() === 'POST' && /\/api\/publico\/reservas/.test(request.url())) mutations.push(request.url()); });
    page.on('console', message => { if (message.type() === 'error' && /\/(privacidad|terminos)(\?|$)/.test(page.url())) errors.push(message.text()+' '+message.location().url); });
    await page.getByRole('button', { name: button, exact: true }).click();
    await expect(page.locator('.legal-modal')).toBeVisible();
    await page.locator('.legal-modal').getByRole('button', { name: 'Cerrar', exact: true }).click();
    await page.getByRole('button', { name: button, exact: true }).click();
    await page.locator('.legal-more').click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expectNoOverflow(page);
    await page.reload();
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await expect(page).toHaveURL(payment);
    await expect(page.getByRole('heading', { name: 'Pago con tarjeta', exact: true })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('vs-public-booking-draft'))).toBe(saved);
    const restoredModal=page.locator('.legal-modal');
    if(await restoredModal.isVisible())await restoredModal.getByRole('button',{name:'Cerrar',exact:true}).click();
    expect(mutations).toEqual([]); await info.attach('console-legal.json',{body:JSON.stringify(errors,null,2),contentType:'application/json'});
    expect(errors.filter(error=>!error.includes('ERR_NETWORK_ACCESS_DENIED')&&!(error.includes('401 (Unauthorized)')&&error.includes('/api/auth/yo')))).toEqual([]);
  });
});
