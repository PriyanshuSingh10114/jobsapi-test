import React from 'react';
import { CheckCircle2, Circle, Clock, AlertOctagon } from 'lucide-react';

export const Timeline = ({
  steps = [],
  currentStepIndex = 0,
  isFailed = false,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex || (index === currentStepIndex && step.status === 'COMPLETED');
        const isCurrent = index === currentStepIndex && step.status !== 'COMPLETED' && !isFailed;
        const isError = index === currentStepIndex && isFailed;
        const isPending = index > currentStepIndex;

        return (
          <div key={step.id || index} className="relative flex items-start gap-3.5 group">
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-px transition-colors duration-200 ${
                  isCompleted ? 'bg-brand-primary' : 'bg-border-warm'
                }`}
              />
            )}

            {/* Icon status indicator */}
            <div className="relative z-10 shrink-0 mt-0.5">
              {isCompleted ? (
                <div className="w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-warm-sm">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : isError ? (
                <div className="w-7 h-7 rounded-full bg-danger text-white flex items-center justify-center shadow-warm-sm">
                  <AlertOctagon className="w-4 h-4" />
                </div>
              ) : isCurrent ? (
                <div className="w-7 h-7 rounded-full bg-brand-subtle border-2 border-brand-primary text-brand-primary flex items-center justify-center animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-surface-soft border border-border-warm text-charcoal-muted flex items-center justify-center">
                  <Circle className="w-2.5 h-2.5 fill-current opacity-40" />
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 pt-0.5 pb-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`text-xs sm:text-sm font-semibold tracking-tight ${
                  isCompleted ? 'text-charcoal' : isCurrent ? 'text-brand-primary font-bold' : isError ? 'text-danger font-bold' : 'text-charcoal-muted'
                }`}>
                  {step.title || step.name}
                </h4>
                {step.timestamp && (
                  <span className="text-[11px] text-charcoal-muted">
                    {step.timestamp}
                  </span>
                )}
              </div>

              {step.description && (
                <p className="text-xs text-charcoal-muted mt-1 leading-relaxed">
                  {step.description}
                </p>
              )}

              {step.logs && step.logs.length > 0 && (
                <div className="mt-2 bg-charcoal text-slate-200 font-mono text-[11px] p-2.5 rounded-lg overflow-x-auto">
                  {step.logs.map((log, i) => (
                    <div key={i} className="leading-tight py-0.5">
                      <span className="text-brand-secondary/80 mr-2">&gt;</span>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
