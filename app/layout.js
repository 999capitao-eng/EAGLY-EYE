import { Sora } from 'next/font/google';
import './globals.css';

const sora = Sora({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata = { title: 'Eagle Eye', description: 'Encontre clientes que precisam de um site.' };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={sora.className}>{children}</body>
    </html>
  );
}
