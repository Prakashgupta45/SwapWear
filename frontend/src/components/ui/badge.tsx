import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'admin' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#fdf2f4] text-[#841d37] border-[#f0a7b6]',
    admin: 'bg-amber-100 text-amber-900 border-amber-300',
    outline: 'border-slate-300 text-slate-700 bg-white',
  };

  return (
    <span
      className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider', variants[variant], className)}
      {...props}
    />
  );
}
