import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    { className, value, max = 100, showLabel = false, variant = 'default', ...props },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variants = {
      default: 'bg-red-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
    };

    return (
      <div className="w-full">
        <div
          ref={ref}
          className={cn(
            'h-2 w-full overflow-hidden rounded-full bg-gray-200',
            className
          )}
          {...props}
        >
          <div
            className={cn(
              'h-full transition-all duration-300 ease-in-out',
              variants[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <p className="mt-1 text-sm text-gray-600">{Math.round(percentage)}%</p>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
