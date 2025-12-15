import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepsProps {
  current: number;
  total: number;
  className?: string;
}

export function Steps({ current, total, className }: StepsProps) {
  return (
    <div className={cn('w-full py-6', className)}>
      <div className="flex items-center justify-between">
        {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  step < current && 'border-primary bg-primary text-primary-foreground',
                  step === current && 'border-primary text-primary',
                  step > current && 'border-muted-foreground/25 text-muted-foreground'
                )}
              >
                {step < current ? <Check className="h-5 w-5" /> : <span>{step}</span>}
              </div>
              <span className="mt-2 text-xs text-muted-foreground">Step {step}</span>
            </div>
            {step < total && (
              <div
                className={cn(
                  'h-[2px] flex-1 mx-2 transition-colors',
                  step < current ? 'bg-primary' : 'bg-muted-foreground/25'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
