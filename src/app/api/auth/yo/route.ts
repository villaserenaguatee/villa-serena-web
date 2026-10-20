import { NextRequest } from 'next/server';
import { authRoute } from '@/lib/bff/auth/http';
export const runtime = 'nodejs';
export const GET = (request: NextRequest) => authRoute(request, 'yo');
