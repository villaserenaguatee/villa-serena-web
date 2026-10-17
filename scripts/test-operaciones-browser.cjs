// Prueba integrada de web/BFF con API y frames STOMP falsos. No usa Spring ni la app.
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { spawn } = require('node:child_process');
const { createWriteStream } = require('node:fs');
const assert = require('node:assert/strict');
const webPort = Number(process.env.OPERACIONES_TEST_PORT ?? 3111), apiPort = webPort + 1;
const base = `http://localhost:${webPort}`;
let browser, next, api;
const room = { id: 4, numero: '204', piso: 2, tipoHabitacion: { id: 1, nombre: 'Standard' }, ocupacion: 'LIBRE', condicion: 'LIMPIA', llegaHoy: false, saleHoy: false, incidenciaPendiente: false, incidenciaBloqueante: null };
const roomRef = { id: room.id, numero: room.numero, piso: room.piso };
const order = { id: 12, creadoEn: '2026-10-07T15:00:00Z', estado: 'NUEVO', items: [{ itemId: 21, nombre: 'Café', cantidad: 2, precioUnitario: 25, subtotal: 50 }], notas: 'Sin azúcar', total: 50, motivoCancelacion: null, habitacion: roomRef, nombreHuesped: 'Ana de prueba', historial: [{ estadoAnterior: null, estadoNuevo: 'NUEVO', responsable: 'Huésped', fechaHora: '2026-10-07T15:00:00Z', motivo: null }] };
const employees = { recepcion: { id: 2, rol: 'RECEPCION', area: null }, roomservice: { id: 4, rol: 'ROOM_SERVICE', area: null }, mantenimiento: { id: 5, rol: 'MANTENIMIENTO_LIMPIEZA', area: 'MANTENIMIENTO' }, limpieza: { id: 3, rol: 'MANTENIMIENTO_LIMPIEZA', area: 'LIMPIEZA' } };
const employee = key => ({ ...employees[key], nombre: key, correo: `${key}@example.test`, debeCambiarContrasena: false });
let tickets = 0, uploads = 0, reports = 0, menuAvailable = true, conflict = false;
const incidents = [{ id: 1, habitacion: roomRef, descripcion: 'Fuga de prueba', impideUso: true, habitacionOcupada: false, estado: 'REPORTADA', reportadaPor: { id: 2, nombre: 'Recepción' }, reportadaEn: '2026-10-07T14:00:00Z', tecnicoACargo: null, resueltaEn: null, fotoUrl: null }];
const activeSockets = new Set(), connectTickets = [], errors = [];
async function body(req) { const chunks = []; for await (const chunk of req) chunks.push(chunk); const raw = Buffer.concat(chunks); return req.headers['content-type']?.includes('application/json') ? JSON.parse(raw) : raw; }
async function login(page, name) {
  await page.goto(`${base}/panel/login`); await page.getByLabel('Correo', { exact: true }).fill(`${name}@example.test`); await page.getByLabel('Contraseña', { exact: true }).fill('clave-de-prueba');
  const result = page.waitForResponse(r => r.url().endsWith('/api/auth/login'));
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click(); const response = await result;
  assert.equal(response.status(), 200, JSON.stringify(await response.json()));
  // Comprobar cookies/SSR con navegación completa; el login demo tiene su
  // propio recorrido en test-staff-session-browser.cjs.
  await page.goto(`${base}/panel`);
  try { await page.getByRole('heading', { name: 'Panel del personal' }).waitFor(); }
  catch (error) { console.error('Página de prueba:', page.url(), (await page.locator('body').innerText()).slice(0, 1800)); throw error; }
}
function event(destination, value) {
  for (const socket of activeSockets) for (const [id, path] of socket.subs) if (path === destination)
    socket.route.send(`MESSAGE\nsubscription:${id}\nmessage-id:prueba-${Date.now()}\ndestination:${destination}\n\n${JSON.stringify(value)}\0`);
}
async function realtime(page) {
  await page.routeWebSocket(`ws://127.0.0.1:${apiPort}/ws`, route => {
    const socket = { route, subs: new Map() }; activeSockets.add(socket);
    route.onClose(() => activeSockets.delete(socket));
    route.onMessage(message => {
      const raw = String(message);
      if (raw.startsWith('CONNECT\n') || raw.startsWith('STOMP\n')) { const ticket = raw.match(/\nticket:([^\n]+)/)?.[1]; assert.ok(ticket?.startsWith('ticket-')); assert.ok(!raw.includes('Bearer')); connectTickets.push(ticket); route.send('CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0'); }
      if (raw.startsWith('SUBSCRIBE\n')) socket.subs.set(raw.match(/\nid:([^\n]+)/)[1], raw.match(/\ndestination:([^\n]+)/)[1]);
      if (raw.startsWith('UNSUBSCRIBE\n')) socket.subs.delete(raw.match(/\nid:([^\n]+)/)[1]);
    });
  });
}
async function subscribed(page, destination) {
  for (let i = 0; i < 100 && ![...activeSockets].some(s => [...s.subs.values()].includes(destination)); i++) await page.waitForTimeout(100);
  assert.ok([...activeSockets].some(s => [...s.subs.values()].includes(destination)), 'El cliente no completó la suscripción STOMP.');
}
(async () => {
  api = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, `http://localhost:${apiPort}`).pathname;
      const key = req.headers.authorization?.replace('Bearer prueba-', '') ?? 'recepcion';
      const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
      if (path.endsWith('/auth/login')) { const input = await body(req), name = input.correo.split('@')[0]; return json({ accessToken: `prueba-${name}`, refreshToken: 'refresh-de-prueba', tipoToken: 'Bearer', expiraEn: 900, empleado: employee(name) }); }
      if (path.endsWith('/auth/yo')) return json(employee(key));
      if (path.endsWith('/auth/ws-ticket')) return json({ ticket: `ticket-${++tickets}`, expiraEn: new Date(Date.now() + 60000).toISOString(), accessToken: 'campo-que-no-debe-salir' });
      if (path === '/api/v1/habitaciones') return json([room]);
      if (path === '/api/v1/room-service/pedidos') return json(['ENTREGADO', 'CANCELADO'].includes(order.estado) ? [] : [order]);
      if (path === '/api/v1/room-service/pedidos/12') return json(order);
      if (path.endsWith('/pedidos/12/avanzar')) { const input = await body(req); if (conflict) { conflict = false; return json({ mensaje: 'Otro empleado cambió el pedido' }, 409); } assert.equal(input.estadoEsperado, order.estado); order.estado = input.nuevoEstado; return json(order); }
      if (path.endsWith('/pedidos/12/cancelar')) { const input = await body(req); assert.ok(input.motivo.trim()); order.estado = 'CANCELADO'; order.motivoCancelacion = input.motivo; return json(order); }
      if (path.endsWith('/room-service/menu')) return json({ categorias: [{ id: 1, nombre: 'Bebidas' }], items: [{ id: 21, categoriaId: 1, nombre: 'Café', descripcion: 'De prueba', precio: 25, fotoUrl: null, disponibilidad: menuAvailable ? 'DISPONIBLE' : 'AGOTADO' }] });
      if (path.endsWith('/items/21/agotar')) { menuAvailable = false; return json({}); }
      if (path === '/api/v1/archivos/imagenes') { assert.ok((await body(req)).includes(Buffer.from('INCIDENCIA'))); uploads++; return json({ clave: 'incidencias/prueba.png' }, 201); }
      if (path === '/api/v1/incidencias') {
        if (req.method === 'GET') return json(incidents.filter(i => i.estado !== 'RESUELTA'));
        const input = await body(req); assert.equal(input.habitacionId, 4); assert.equal(input.fotoClave, 'incidencias/prueba.png'); reports++;
        const item = { ...incidents[0], id: 2, descripcion: input.descripcion, impideUso: input.impideUso, estado: 'REPORTADA', tecnicoACargo: null }; incidents.push(item); return json(item, 201);
      }
      const match = path.match(/\/incidencias\/(\d+)\/(tomar|resolver)$/);
      if (match) { const item = incidents.find(i => i.id === Number(match[1])); if (match[2] === 'tomar') { item.estado = 'EN_PROCESO'; item.tecnicoACargo = { id: 5, nombre: 'Técnico de prueba' }; } else { const input = await body(req); assert.ok(input.solucion.trim()); item.estado = 'RESUELTA'; } return json(item); }
      return json({ mensaje: `Ruta de prueba no definida: ${path}` }, 404);
    } catch (error) { errors.push(error.message); res.writeHead(500); res.end(); }
  });
  await new Promise(resolve => api.listen(apiPort, '127.0.0.1', resolve));
  next = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--port', String(webPort)], { env: { ...process.env, STAFF_AUTH_MODE: 'spring', API_URL: `http://127.0.0.1:${apiPort}`, NEXT_PUBLIC_WS_URL: `ws://127.0.0.1:${apiPort}/ws` }, stdio: ['ignore', 'pipe', 'pipe'] });
  const log = createWriteStream('/tmp/villa-serena-operaciones-next.log'); next.stdout.pipe(log); next.stderr.pipe(log);
  for (let i = 0; i < 120; i++) { try { if ((await fetch(`${base}/panel/login`)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 500)); }
  browser = await chromium.launch({ headless: true });
  for (const width of [1440, 390]) {
    order.estado = 'NUEVO'; menuAvailable = true;
    const context = await browser.newContext({ viewport: { width, height: 900 } }), page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await realtime(page);
    await login(page, 'roomservice'); await page.goto(`${base}/room-service`);
    await page.getByRole('button', { name: 'Pedidos', exact: true }).last().click();
    await page.getByText('Ana de prueba', { exact: false }).first().waitFor();
    await subscribed(page, '/topic/pedidos');
    event('/topic/pedidos', { tipo: 'NUEVO_PEDIDO', datos: order });
    await page.getByText('Nuevo pedido de Room Service', { exact: true }).waitFor();
    await page.getByRole('button').filter({ hasText: 'Toca para ver el detalle' }).click();
    await page.getByRole('heading', { name: 'Pedido #12' }).waitFor();
    conflict = true; await page.getByRole('button', { name: 'Marcar en preparación', exact: true }).click();
    await page.getByText('Otro empleado cambió estos datos.', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Marcar en preparación', exact: true }).click();
    await page.getByRole('button', { name: 'Marcar en camino', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Cancelar pedido', exact: true }).click();
    await page.getByPlaceholder('Describe el motivo de la cancelación…').fill('Prueba de cancelación'); await page.getByRole('button', { name: 'Confirmar cancelación', exact: true }).click();
    await page.getByRole('heading', { name: 'Pedido #12' }).waitFor({ state: 'hidden' }); assert.equal(order.estado, 'CANCELADO');
    const count = connectTickets.length;
    for (const s of [...activeSockets]) s.route.close();
    for (let i = 0; i < 80 && connectTickets.length <= count; i++) await page.waitForTimeout(100);
    assert.ok(connectTickets.length > count); assert.equal(new Set(connectTickets).size, connectTickets.length);
    await page.getByRole('button', { name: width === 390 ? 'Menú' : 'Menú y catálogo', exact: true }).last().click();
    await page.getByRole('button', { name: 'Marcar agotado', exact: true }).click(); await page.getByRole('button', { name: 'Marcar agotado', exact: true }).waitFor({ state: 'hidden' });
    assert.equal(await page.getByRole('button', { name: /Reactivar/ }).count(), 0);
    await context.close(); activeSockets.clear();

    const reception = await browser.newContext({ viewport: { width, height: 900 } }), rp = await reception.newPage(); rp.on('pageerror', e => errors.push(e.message));
    await realtime(rp);
    await login(rp, 'recepcion'); await rp.goto(`${base}/recepcion/habitaciones`);
    await subscribed(rp, '/topic/habitaciones');
    const roomCard = rp.locator('[data-room="204"]');
    room.condicion = 'EN_LIMPIEZA'; event('/topic/habitaciones', { tipo: 'HABITACION', datos: room }); await roomCard.getByText('En limpieza', { exact: false }).waitFor();
    room.condicion = 'LIMPIA'; event('/topic/habitaciones', { tipo: 'HABITACION', datos: room }); await roomCard.getByText('Limpia', { exact: false }).waitFor();
    await rp.getByRole('button', { name: 'Reportar daño', exact: true }).click();
    const dialog = rp.getByRole('dialog', { name: 'Reportar daño' }); await dialog.getByLabel('Descripción', { exact: true }).fill('Ventana de prueba');
    await dialog.locator('input[type=file]').setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: Buffer.alloc(6 * 1024 * 1024) });
    await dialog.getByText('La foto debe pesar como máximo 5 MB.', { exact: true }).waitFor(); const before = uploads;
    assert.ok(await dialog.getByRole('button', { name: 'Reportar daño', exact: true }).isDisabled()); assert.equal(uploads, before);
    await dialog.locator('input[type=file]').setInputFiles({ name: 'prueba.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF4kAAAAASUVORK5CYII=', 'base64') });
    await dialog.getByRole('button', { name: 'Reportar daño', exact: true }).click(); await dialog.waitFor({ state: 'hidden' }); assert.equal(uploads, before + 1); assert.ok(reports > 0);
    await reception.close(); activeSockets.clear();
    const maintenance = await browser.newContext({ viewport: { width, height: 900 } }), mp = await maintenance.newPage(); mp.on('pageerror', e => errors.push(e.message));
    incidents[0].estado = 'REPORTADA'; incidents[0].tecnicoACargo = null;
    await login(mp, 'mantenimiento'); await mp.goto(`${base}/mantenimiento/incidencias`);
    const card = mp.getByRole('article').filter({ hasText: 'Fuga de prueba' }); await card.getByRole('button', { name: 'Tomar', exact: true }).click();
    await card.getByRole('button', { name: 'Resolver', exact: true }).waitFor();
    incidents[0].tecnicoACargo = { id: 99, nombre: 'Otro técnico' }; await mp.reload(); await card.getByText('Técnico: Otro técnico', { exact: true }).waitFor(); assert.equal(await card.getByRole('button', { name: 'Resolver', exact: true }).count(), 0);
    incidents[0].tecnicoACargo = { id: 5, nombre: 'Técnico de prueba' }; await mp.getByRole('button', { name: 'Actualizar', exact: true }).click();
    await card.getByRole('button', { name: 'Resolver', exact: true }).click(); await mp.getByLabel('Solución', { exact: true }).fill('Daño reparado en prueba'); await mp.getByRole('button', { name: 'Guardar solución', exact: true }).click(); await card.waitFor({ state: 'hidden' });
    await maintenance.close(); console.log(`PASS operaciones conectadas con API/STOMP falsos: ${width}px`);
  }
  assert.deepEqual(errors, []); console.log('Spring y app reales: PENDIENTES.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); next?.kill('SIGTERM'); api?.closeAllConnections(); api?.close(); });
