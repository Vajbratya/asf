'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  name: string;
  completed: boolean;
  action?: {
    label: string;
    href: string;
  };
}

interface OnboardingProgress {
  steps: OnboardingStep[];
  percentComplete: number;
}

export function OnboardingChecklist() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/v1/onboarding/progress');
        const data = await response.json();
        setProgress(data);
      } catch (error) {
        console.error('Error fetching onboarding progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Setup Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return null;
  }

  const completedSteps = progress.steps.filter((step) => step.completed).length;
  const totalSteps = progress.steps.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Progress</CardTitle>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {completedSteps} of {totalSteps} completed
            </span>
            <span className="text-sm font-semibold">{progress.percentComplete}%</span>
          </div>
          <Progress value={progress.percentComplete} />
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {progress.steps.map((step) => (
            <li key={step.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    step.completed ? 'line-through text-muted-foreground' : 'font-medium'
                  )}
                >
                  {step.name}
                </span>
              </div>
              {!step.completed && step.action && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={step.action.href}>
                    {step.action.label}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
