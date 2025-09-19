import { redirect } from 'next/navigation';
export const dynamic = 'force-static';

export default function CRMPage() {
  // Sirve el panel CRM estático desde /public/crm/index.html
  redirect('/crm/index.html');
}
