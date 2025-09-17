// app/crm/page.tsx
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/crm/index.html'); // tu CRM está en /public/crm/index.html
}
