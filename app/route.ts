// app/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const to = new URL('/index.html', req.url);
  return NextResponse.redirect(to, 308);
}
