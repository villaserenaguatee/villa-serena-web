import type { NextRequest } from 'next/server';
import { receptionRoute } from '@/lib/bff/receptionHttp';
export const runtime = 'nodejs';
export const POST = (request: NextRequest) => receptionRoute(request, 'huespedes');
