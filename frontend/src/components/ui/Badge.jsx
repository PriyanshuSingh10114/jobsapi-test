import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variants = {
    neutral: 'bg-surface-soft text-charcoal-muted border border-border-warm/80 dark:bg-surface-soft dark:text-charcoal-muted dark:border-border-warm',
    brand: 'bg-brand-subtle text-brand-primary border border-brand-secondary/30 dark:bg-brand-primary/20 dark:text-brand-primary dark:border-brand-primary/30',
    success: 'bg-success-bg text-success border border-success/20 dark:bg-success/20 dark:text-success dark:border-success/30',
    warning: 'bg-warning-bg text-warning border border-warning/20 dark:bg-warning/20 dark:text-warning dark:border-warning/30',
    danger: 'bg-danger-bg text-danger border border-danger/20 dark:bg-danger/20 dark:text-danger dark:border-danger/30',
    info: 'bg-info-bg text-info border border-info/20 dark:bg-info/20 dark:text-info dark:border-info/30',
  };

  const dotColors = {
    neutral: 'bg-charcoal-muted',
    brand: 'bg-brand-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 font-medium tracking-tight rounded',
    sm: 'text-xs px-2 py-0.5 font-medium rounded-md',
    md: 'text-xs px-2.5 py-1 font-medium rounded-md',
    lg: 'text-sm px-3 py-1 font-medium rounded-lg',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans whitespace-nowrap transition-colors ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.neutral}`} />
      )}
      {children}
    </span>
  );
};
