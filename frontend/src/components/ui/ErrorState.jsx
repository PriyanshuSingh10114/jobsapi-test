import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading this information. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`card-warm p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-danger-bg border border-danger/20 flex items-center justify-center text-danger mb-4">
        <AlertCircle className="w-6 h-6 stroke-[1.75]" />
      </div>

      <h3 className="text-base font-semibold text-charcoal tracking-tight mb-1.5">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed max-w-sm mb-6">
        {message}
      </p>

      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={RefreshCw}>
          Retry Connection
        </Button>
      )}
    </div>
  );
};
