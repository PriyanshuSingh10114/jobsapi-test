import React from 'react';

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover focus:ring-brand-primary/40 shadow-sm active:translate-y-px',
    secondary: 'bg-surface-soft text-charcoal hover:bg-border-warm/60 border border-border-warm focus:ring-brand-primary/20 active:translate-y-px dark:bg-surface-soft dark:text-charcoal dark:border-border-warm',
    outline: 'bg-transparent text-charcoal border border-border-warm hover:bg-surface-soft/60 focus:ring-brand-primary/20 active:translate-y-px dark:text-charcoal dark:border-border-warm',
    ghost: 'bg-transparent text-charcoal-muted hover:text-charcoal hover:bg-surface-soft/80 focus:ring-brand-primary/10 active:translate-y-px dark:text-charcoal-muted dark:hover:text-charcoal',
    danger: 'bg-danger text-white hover:bg-danger/90 focus:ring-danger/30 shadow-sm active:translate-y-px',
    brandSoft: 'bg-brand-subtle text-brand-primary hover:bg-brand-secondary/20 focus:ring-brand-primary/20 dark:bg-brand-primary/20 dark:text-brand-primary',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1 gap-1.5',
    sm: 'text-xs px-3 py-1.5 gap-1.5 font-medium',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-medium',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}

      {children}

      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
});

Button.displayName = 'Button';
