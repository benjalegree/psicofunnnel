// Redirige la home a tu HTML estático
import { redirect } from 'next/navigation';
export const dynamic = 'force-static';

export default function Home() {
  redirect('/index.html');
}
