import * as React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success';
}

export function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
  const variants = {
    default: 'bg-blue-50 text-blue-800 border-blue-200',
    destructive: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };

  const icons = {
    default: <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />,
    destructive: <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={cn('relative w-full rounded-lg border p-4 flex gap-3 text-sm font-medium', variants[variant], className)}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1">{children}</div>
    </div>
  );
}
