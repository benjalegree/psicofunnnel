// app/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL('/index.html', req.url);
  return NextResponse.redirect(url);
}
