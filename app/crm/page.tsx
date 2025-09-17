// Redirige /crm a tu HTML estático del CRM
import { redirect } from 'next/navigation';
export const dynamic = 'force-static';

export default function CRM() {
  redirect('/crm/index.html');
}
