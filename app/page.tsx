import { redirect } from 'next/navigation';
export const dynamic = 'force-static';

export default function Page() {
  // Sirve la home estática desde /public/index.html
  redirect('/index.html');
}
