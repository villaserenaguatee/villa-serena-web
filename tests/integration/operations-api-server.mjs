import { createServer } from 'node:http';
import { createOperationsApi } from './operations-api.ts';

const token = process.env.ISSUE48_OPERATIONS_MOCK_TOKEN;
if (!token) throw new Error('Missing operations mock control token');
const api = createOperationsApi();
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const send = (value, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(value)); };
  try {
    if (path === '/health' && request.method === 'GET') return send({ ready: true });
    if (path.startsWith('/__test/') && request.headers.authorization !== `Bearer ${token}`) return send({ mensaje: 'Control no autorizado' }, 403);
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    const body = !raw.length ? undefined : request.headers['content-type']?.includes('application/json') ? JSON.parse(raw.toString('utf8')) : raw;
    if (path === '/__test/reset' && request.method === 'POST') { api.reset(); return send(api.snapshot()); }
    if (path === '/__test/configure' && request.method === 'POST') { api.configure(body); return send(api.snapshot()); }
    if (path === '/__test/state' && request.method === 'GET') return send(api.snapshot());
    const result = await api.dispatch({ method: request.method, path, authorization: request.headers.authorization, body });
    send(result.body, result.status);
  } catch (error) { send({ mensaje: error.message }, 500); }
});
server.listen(3049, '127.0.0.1');
function stop() { server.closeAllConnections(); server.close(); }
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
