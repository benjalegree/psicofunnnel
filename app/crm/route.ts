export const runtime = 'nodejs';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  const file = join(process.cwd(), 'public', 'crm', 'index.html');
  const html = await readFile(file, 'utf8');
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
