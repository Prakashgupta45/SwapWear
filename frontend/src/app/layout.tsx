import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'SwapWear | Sustainable Clothing Exchange & Marketplace',
  description: 'Exchange, swap, and circulate pre-loved fashion sustainably.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#faf9f6] text-slate-900 antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4">
              <p>© 2026 SwapWear Marketplace. Sustainable pre-loved clothing exchange. Phase 1 Architecture.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
