'use client';

import React from 'react';
import { ConditionVerificationResult } from '../types/listing';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';
import { Button } from './ui/button';
 
interface AiConditionCardProps {
  assessment: ConditionVerificationResult;
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
  canReanalyze?: boolean;
  className?: string;
}

export function AiConditionCard({
  assessment,
  onReanalyze,
  isReanalyzing = false,
  canReanalyze = false,
  className = '',
}: AiConditionCardProps) {
  if (!assessment.verificationAvailable && assessment.verificationStatus === 'NOT_ANALYZED') {
    return null;
  }

  const isConsistent = assessment.verificationStatus === 'CONSISTENT';
  const isReview = assessment.verificationStatus === 'REVIEW_RECOMMENDED';
  const isWarning = assessment.verificationStatus === 'MISMATCH_WARNING';
  const isFailed = assessment.verificationStatus === 'FAILED';

  const formatCondition = (c: string | null) => {
    if (!c) return 'Unavailable';
    return c.replace('_', ' ');
  };

  return (
    <div
      className={`rounded-xl border p-4.5 space-y-3.5 transition-all shadow-2xs ${
        isConsistent
          ? 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950'
          : isReview
          ? 'bg-amber-50/75 border-amber-200/90 text-amber-950'
          : isWarning
          ? 'bg-rose-50/75 border-rose-200/90 text-rose-950'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`p-1.5 rounded-lg flex items-center justify-center ${
              isConsistent
                ? 'bg-emerald-600 text-white'
                : isReview
                ? 'bg-amber-600 text-white'
                : isWarning
                ? 'bg-rose-600 text-white'
                : 'bg-slate-600 text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              AI Condition Assessment
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Automated image analysis assistance
            </span>
          </div>
        </div>

        {canReanalyze && onReanalyze && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReanalyze}
            disabled={isReanalyzing}
            className="h-7 text-xs px-2.5 bg-white/80 hover:bg-white shadow-2xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isReanalyzing ? 'animate-spin' : ''}`} />
            {isReanalyzing ? 'Analyzing...' : 'Re-analyze'}
          </Button>
        )}
      </div>

      {isFailed ? (
        <div className="p-3 bg-white/70 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Condition analysis is temporarily unavailable.</p>
          <p className="text-[11px] text-slate-500">
            {assessment.recommendation || 'You can still manage or swap this listing normally using your declared condition.'}
          </p>
          <p className="text-[10px] text-slate-400">
            (Add Gemini API key in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">backend/.env</code> under <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">AI_API_KEY</code> to enable live AI vision assessment)
          </p>
        </div>
      ) : (
        <>
          {/* Main comparison grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200/80 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Seller Declared
              </span>
              <span className="text-sm font-extrabold text-slate-800">
                {formatCondition(assessment.declaredCondition)}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200/80 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                AI Estimated
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-sm font-extrabold text-slate-900">
                  {formatCondition(assessment.estimatedCondition)}
                </span>
                {assessment.confidence !== null && (
                  <span className="text-[11px] font-bold text-slate-500">
                    ({assessment.confidence}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status banner */}
          <div
            className={`flex items-start space-x-2 p-2.5 rounded-lg text-xs font-medium border ${
              isConsistent
                ? 'bg-emerald-100/60 border-emerald-200 text-emerald-800'
                : isReview
                ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                : 'bg-rose-100/70 border-rose-300 text-rose-900'
            }`}
          >
            {isConsistent ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-700 flex-shrink-0" />
            ) : isReview ? (
              <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-700 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 text-rose-700 flex-shrink-0" />
            )}

            <div className="space-y-0.5 flex-1">
              <div className="font-bold flex items-center justify-between">
                <span>
                  {isConsistent
                    ? 'Condition Consistent'
                    : isReview
                    ? 'Review Recommended'
                    : 'Condition Mismatch Detected'}
                </span>
                {assessment.imageQuality && (
                  <span className="text-[10px] uppercase font-bold text-slate-600 bg-white/60 px-1.5 py-0.5 rounded">
                    Photo: {assessment.imageQuality}
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed">
                {assessment.recommendation ||
                  (isConsistent
                    ? 'Uploaded garment images match the declared condition.'
                    : 'Possible wear or differences observed between photo and declared condition.')}
              </p>
            </div>
          </div>

          {/* Visible Issues List (if any) */}
          {assessment.visibleIssues && assessment.visibleIssues.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Eye className="h-3 w-3" /> Visible Observations:
              </span>
              <ul className="space-y-1">
                {assessment.visibleIssues.map((issue, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-700 flex items-start space-x-1.5 pl-1"
                  >
                    <span className="text-slate-400 mt-1">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Mandatory Disclaimer (Rule 4) */}
      <div className="pt-2 border-t border-slate-200/60 flex items-center space-x-1.5 text-[10px] text-slate-500">
        <Info className="h-3 w-3 text-slate-400 flex-shrink-0" />
        <span>{assessment.notice}</span>
      </div>
    </div>
  );
}
