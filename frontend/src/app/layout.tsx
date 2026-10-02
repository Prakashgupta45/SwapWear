import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import Link from 'next/link';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SwapWear | Buy, Sell & Swap Pre-Loved Fashion',
  description: 'Shop curated secondhand fashion, sustainable style and pre-loved clothing on SwapWear.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#faf9f6] text-slate-900 font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <h4 className="font-serif font-bold text-slate-900 text-sm mb-3">About</h4>
                  <ul className="space-y-2">
                    <li><Link href="/marketplace" className="hover:text-[#841d37] transition-colors">About Us</Link></li>
                    <li><Link href="/marketplace" className="hover:text-[#841d37] transition-colors">Trust & Safety</Link></li>
                    <li><Link href="/marketplace" className="hover:text-[#841d37] transition-colors">Sustainability & Circular Fashion</Link></li>
                    <li><Link href="/marketplace" className="hover:text-[#841d37] transition-colors">Press & Media</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-900 text-sm mb-3">Shop Categories</h4>
                  <ul className="space-y-2">
                    <li><Link href="/marketplace?department=women" className="hover:text-[#841d37] transition-colors">Women&apos;s Fashion</Link></li>
                    <li><Link href="/marketplace?department=men" className="hover:text-[#841d37] transition-colors">Men&apos;s Wardrobe</Link></li>
                    <li><Link href="/marketplace?department=kids" className="hover:text-[#841d37] transition-colors">Kids & Babies</Link></li>
                    <li><Link href="/marketplace?category=ACCESSORIES" className="hover:text-[#841d37] transition-colors">Luxury & Handbags</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-900 text-sm mb-3">Sell & Swap</h4>
                  <ul className="space-y-2">
                    <li><Link href="/listings/new" className="hover:text-[#841d37] transition-colors">List an Item</Link></li>
                    <li><Link href="/my-listings" className="hover:text-[#841d37] transition-colors">My Closet</Link></li>
                    <li><Link href="/marketplace" className="hover:text-[#841d37] transition-colors">Pricing & Condition Guide</Link></li>
                    <li><Link href="/marketplace" className="hover:text-[#841d37] transition-colors">Community Guidelines</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-900 text-sm mb-3">Support & Legal</h4>
                  <ul className="space-y-2">
                    <li><Link href="/dashboard" className="hover:text-[#841d37] transition-colors">Account Dashboard</Link></li>
                    <li><Link href="/marketplace" className="hover:text-[#841d37] transition-colors">Buyer Protection Policy</Link></li>
                    <li><Link href="/marketplace" className="hover:text-[#841d37] transition-colors">Privacy Policy</Link></li>
                    <li><Link href="/marketplace" className="hover:text-[#841d37] transition-colors">Terms of Service</Link></li>
                  </ul>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-extrabold text-sm tracking-wider text-[#841d37]">SWAPWEAR</span>
                  <span>|</span>
                  <span className="text-[11px]">SwapWear Sustainable Exchange Platform</span>
                </div>
                <p className="text-[11px]">© 2026 SwapWear Marketplace. Built with sustainable circular fashion values.</p>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
