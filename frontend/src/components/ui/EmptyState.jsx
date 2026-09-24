import React from 'react';
import { Inbox, ArrowRight } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are currently no items matching your criteria.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div className={`card-warm p-10 sm:p-14 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-surface-soft border border-border-warm flex items-center justify-center text-charcoal-muted mb-4 shadow-warm-sm">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>

      <h3 className="text-lg font-semibold text-charcoal tracking-tight mb-1.5">
        {title}
      </h3>

      <p className="text-sm text-charcoal-muted leading-relaxed max-w-sm mb-6">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryActionLabel && (
            <Button variant="secondary" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && (
            <Button variant="primary" size="md" onClick={onAction} icon={ArrowRight} iconPosition="right">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
