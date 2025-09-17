// app/page.tsx
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/index.html'); // tu home está en /public/index.html
}
