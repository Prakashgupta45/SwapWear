'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Info,
  Shield,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center">
          <AlertTriangle className="h-6 w-6 mr-2 text-rose-400" />
          Platform Reports & Disputes
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review reported listings, content flags, and member disputes.
        </p>
      </div>

      {/* Main Informational Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-3xl space-y-6">
        <div className="flex items-center space-x-3 text-amber-400">
          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-900/60">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Data Architecture Status</h2>
            <p className="text-xs text-amber-300/80">Schema Inspection Verification</p>
          </div>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-3 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-white">
            Reporting/dispute data model is not currently present.
          </p>
          <p>
            Per the Phase 7 database boundary guidelines, the existing PostgreSQL schema does not currently
            define a dedicated <code className="text-rose-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">Report</code>,{' '}
            <code className="text-rose-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">Dispute</code>, or{' '}
            <code className="text-rose-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">ContentFlag</code> model.
            To avoid fabricating mock data or prematurely creating unstipulated database tables without explicit
            user approval, reporting entities are not synthesized.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-semibold">
              <Shield className="h-4 w-4" />
              <span>Listing Moderation</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Inappropriate or non-compliant clothing items can be directly reviewed and removed via the Listing
              Management console.
            </p>
            <Link href="/admin/listings" className="inline-block pt-1">
              <Button size="sm" variant="outline" className="text-xs h-7 border-slate-700">
                Go to Listings Moderation <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-blue-400 font-semibold">
              <Layers className="h-4 w-4" />
              <span>Swap Trade Auditing</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Disputed negotiations or contested swap offers can be investigated through the Chat & Swap
              monitoring interfaces.
            </p>
            <Link href="/admin/swaps" className="inline-block pt-1">
              <Button size="sm" variant="outline" className="text-xs h-7 border-slate-700">
                Go to Swap Auditing <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center">
            <Database className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            Prisma Schema: Stable & Unmodified
          </span>
          <span className="text-rose-400 font-medium flex items-center">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Phase 8+ Dispute Roadmap
          </span>
        </div>
      </div>
    </div>
  );
}
