export const metadata = {
  title: 'PsicoFunnel',
  description: 'Landing builder + Blob hosting'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
