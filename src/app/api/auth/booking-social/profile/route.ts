import { NextRequest } from 'next/server';
import { readBookingSocialProfile } from '@/lib/bff/bookingSocial';
export const runtime = 'nodejs';
export const GET = (request: NextRequest) => readBookingSocialProfile(request);
