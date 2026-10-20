import type { NextRequest } from 'next/server';
import { receptionRoute } from '@/lib/bff/receptionHttp';
export const runtime = 'nodejs';
const handle = (request: NextRequest) => receptionRoute(request, 'reservas');
export const GET = handle, POST = handle, PUT = handle, PATCH = handle, DELETE = handle;
