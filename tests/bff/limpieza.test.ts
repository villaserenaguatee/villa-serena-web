import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../src/app/api/[...ruta]/route';
import {
  ordenarHabitaciones,
  ordenarSolicitudes,
  type HabitacionLimpiezaAPI,
  type SolicitudLimpiezaAPI,
} from '../../src/features/limpieza/useLimpieza';

test('limpieza BFF: área y rol; acceso permitido a Limpieza/Ambas y denegado a Mantenimiento/otros', async () => {
  const previous = { fetch: globalThis.fetch, mode: process.env.STAFF_AUTH_MODE, url: process.env.API_URL };
  process.env.STAFF_AUTH_MODE = 'spring';
  process.env.API_URL = 'http://api.test';

  let currentEmployee = {
    id: 3,
    nombre: 'Limpieza Test',
    correo: 'limpieza@example.test',
    rol: 'MANTENIMIENTO_LIMPIEZA',
    area: 'LIMPIEZA',
    debeCambiarContrasena: false,
  };
  let springCalls = 0;

  globalThis.fetch = async (url, init) => {
    const urlStr = String(url);
    if (urlStr.endsWith('/yo')) return Response.json(currentEmployee);
    springCalls++;
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer token-limpieza');
    if (urlStr.includes('/limpieza/habitaciones')) {
      return Response.json([
        {
          habitacion: { id: 4, numero: '204', piso: 2 },
          condicion: 'SUCIA',
          llegadaHoy: true,
          suciaDesde: '2026-10-07T12:00:00Z',
          empleadoACargo: null,
        },
      ]);
    }
    if (urlStr.includes('/limpieza/solicitudes')) {
      return Response.json([
        {
          id: 8,
          tipo: 'LIMPIEZA',
          creadaEn: '2026-10-07T13:00:00Z',
          estado: 'PENDIENTE',
          comentario: 'Toallas extra',
          articulos: [],
          habitacion: { id: 4, numero: '204', piso: 2 },
          empleadoACargo: null,
        },
      ]);
    }
    return Response.json({ ok: true });
  };

  const req = (path: string, method = 'GET') =>
    new NextRequest(`http://localhost:3000/api/${path}`, {
      method,
      headers: { origin: 'http://localhost:3000', cookie: 'vs_staff_access=token-limpieza' },
    });
  const ctx = (ruta: string[]) => ({ params: Promise.resolve({ ruta }) });

  try {
    // 1. Empleado con área LIMPIEZA tiene acceso permitido
    currentEmployee = { id: 3, nombre: 'Limpieza', correo: 'limp@test.com', rol: 'MANTENIMIENTO_LIMPIEZA', area: 'LIMPIEZA', debeCambiarContrasena: false };
    const resHabs = await GET(req('limpieza/habitaciones'), ctx(['limpieza', 'habitaciones']));
    assert.equal(resHabs.status, 200);
    const habsData = await resHabs.json();
    assert.equal(habsData.length, 1);
    assert.equal(habsData[0].habitacion.numero, '204');

    const resSols = await GET(req('limpieza/solicitudes'), ctx(['limpieza', 'solicitudes']));
    assert.equal(resSols.status, 200);
    const solsData = await resSols.json();
    assert.equal(solsData.length, 1);
    assert.equal(solsData[0].id, 8);

    // 2. Empleado con área AMBAS tiene acceso permitido
    currentEmployee = { id: 10, nombre: 'Ambas', correo: 'ambas@test.com', rol: 'MANTENIMIENTO_LIMPIEZA', area: 'AMBAS', debeCambiarContrasena: false };
    const resAmbas = await GET(req('limpieza/habitaciones'), ctx(['limpieza', 'habitaciones']));
    assert.equal(resAmbas.status, 200);

    // 3. Empleado solo de MANTENIMIENTO ve 403 Acceso denegado (Criterio 3)
    currentEmployee = { id: 5, nombre: 'Mantenimiento Solo', correo: 'mant@test.com', rol: 'MANTENIMIENTO_LIMPIEZA', area: 'MANTENIMIENTO', debeCambiarContrasena: false };
    const resMantHabs = await GET(req('limpieza/habitaciones'), ctx(['limpieza', 'habitaciones']));
    assert.equal(resMantHabs.status, 403);
    const errorMant = await resMantHabs.json();
    assert.match(errorMant.mensaje, /Acceso denegado/);

    const resMantSols = await GET(req('limpieza/solicitudes'), ctx(['limpieza', 'solicitudes']));
    assert.equal(resMantSols.status, 403);

    const resMantIniciar = await POST(req('limpieza/habitaciones/4/iniciar', 'POST'), ctx(['limpieza', 'habitaciones', '4', 'iniciar']));
    assert.equal(resMantIniciar.status, 403);

    // 4. Otros roles (RECEPCION, ROOM_SERVICE) ven 403
    currentEmployee = { id: 2, nombre: 'Recepcion', correo: 'rec@test.com', rol: 'RECEPCION', area: null as any, debeCambiarContrasena: false };
    const resRec = await GET(req('limpieza/habitaciones'), ctx(['limpieza', 'habitaciones']));
    assert.equal(resRec.status, 403);

    currentEmployee = { id: 4, nombre: 'Room Service', correo: 'rs@test.com', rol: 'ROOM_SERVICE', area: null as any, debeCambiarContrasena: false };
    const resRS = await GET(req('limpieza/solicitudes'), ctx(['limpieza', 'solicitudes']));
    assert.equal(resRS.status, 403);
  } finally {
    globalThis.fetch = previous.fetch;
    if (previous.mode === undefined) delete process.env.STAFF_AUTH_MODE; else process.env.STAFF_AUTH_MODE = previous.mode;
    if (previous.url === undefined) delete process.env.API_URL; else process.env.API_URL = previous.url;
  }
});

test('ordenación de habitaciones y solicitudes por reglas de negocio', () => {
  // Habitaciones: primero llegadaHoy = true, luego antigüedad sucia
  const habs: HabitacionLimpiezaAPI[] = [
    {
      habitacion: { id: 1, numero: '101', piso: 1 },
      condicion: 'SUCIA',
      llegadaHoy: false,
      suciaDesde: '2026-10-07T10:00:00Z',
      empleadoACargo: null,
    },
    {
      habitacion: { id: 2, numero: '102', piso: 1 },
      condicion: 'SUCIA',
      llegadaHoy: true,
      suciaDesde: '2026-10-07T12:00:00Z',
      empleadoACargo: null,
    },
    {
      habitacion: { id: 3, numero: '103', piso: 1 },
      condicion: 'EN_LIMPIEZA',
      llegadaHoy: false,
      suciaDesde: '2026-10-07T08:00:00Z',
      empleadoACargo: { id: 3, nombre: 'María' },
    },
  ];

  const habsOrdenadas = ordenarHabitaciones(habs);
  assert.equal(habsOrdenadas[0].habitacion.numero, '102'); // llegadaHoy = true primero
  assert.equal(habsOrdenadas[1].habitacion.numero, '103'); // 08:00 antes que 10:00
  assert.equal(habsOrdenadas[2].habitacion.numero, '101'); // 10:00

  // Solicitudes: por antigüedad (más antigua primero)
  const sols: SolicitudLimpiezaAPI[] = [
    {
      id: 20,
      tipo: 'ARTICULOS',
      creadaEn: '2026-10-07T14:30:00Z',
      estado: 'PENDIENTE',
      comentario: null,
      articulos: [{ articuloId: 1, nombre: 'Jabón', cantidad: 1 }],
      habitacion: { id: 1, numero: '101', piso: 1 },
      empleadoACargo: null,
    },
    {
      id: 10,
      tipo: 'LIMPIEZA',
      creadaEn: '2026-10-07T11:00:00Z',
      estado: 'PENDIENTE',
      comentario: null,
      articulos: [],
      habitacion: { id: 2, numero: '102', piso: 1 },
      empleadoACargo: null,
    },
    {
      id: 15,
      tipo: 'LIMPIEZA',
      creadaEn: '2026-10-07T13:00:00Z',
      estado: 'EN_PROCESO',
      comentario: null,
      articulos: [],
      habitacion: { id: 3, numero: '103', piso: 1 },
      empleadoACargo: { id: 3, nombre: 'María' },
    },
  ];

  const solsOrdenadas = ordenarSolicitudes(sols);
  assert.equal(solsOrdenadas[0].id, 10); // 11:00 más antigua
  assert.equal(solsOrdenadas[1].id, 15); // 13:00
  assert.equal(solsOrdenadas[2].id, 20); // 14:30
});
