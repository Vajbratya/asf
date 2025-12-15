/**
 * Error alert components
 */

import { AlertCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from './card';
import { Button } from './button';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorAlert({ message, onRetry, className = '' }: ErrorAlertProps) {
  return (
    <Card className={`border-destructive ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-muted-foreground">{message}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <XCircle className="h-5 w-5 text-destructive" />
        <p className="text-sm text-destructive">{message}</p>
      </div>
    </div>
  );
}
