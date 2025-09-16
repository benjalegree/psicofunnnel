import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Deja pasar todo. (Luego, si querés subdominios, lo afinamos)
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}
