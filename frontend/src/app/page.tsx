'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Sparkles, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Sustainable badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-forest-100/90 border border-forest-200 text-forest-800 text-xs font-semibold tracking-wide">
          <Sparkles className="h-3.5 w-3.5 text-forest-700" />
          <span>Circular Fashion Marketplace • Phase 1</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          Swap clothes sustainably. <br />
          <span className="text-forest-700">Refresh your style with zero waste.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-2xl mx-auto text-lg text-slate-600 sm:text-xl font-normal leading-relaxed">
          SwapWear connects eco-conscious fashion enthusiasts to exchange pre-loved garments,
          reduce landfill waste, and build a greener wardrobe community.
        </p>

        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto shadow-md shadow-forest-800/20">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto shadow-md shadow-forest-800/20">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In to SwapWear
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-forest-100 flex items-center justify-center text-forest-700">
              <RefreshCw className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Exchange & Swap</h3>
            <p className="text-sm text-slate-500">
              Circulate items directly with other members to extend garment lifecycle and promote sustainability.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-forest-100 flex items-center justify-center text-forest-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Enterprise Security</h3>
            <p className="text-sm text-slate-500">
              Bcrypt-hashed credentials, HTTP-only secure cookie authentication, and robust role-based access control.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-forest-100 flex items-center justify-center text-forest-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Modern Architecture</h3>
            <p className="text-sm text-slate-500">
              Next.js frontend, Express backend, PostgreSQL database, and Prisma ORM for high-performance transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
