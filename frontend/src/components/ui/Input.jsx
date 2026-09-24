import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-charcoal mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-charcoal-muted pointer-events-none flex items-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full text-sm bg-surface border rounded-lg px-3 py-2 text-charcoal placeholder:text-charcoal-muted/60 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:opacity-50 disabled:bg-surface-soft ${
            Icon ? 'pl-9' : ''
          } ${
            error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-border-warm'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
      {!error && helperText && <p className="text-xs text-charcoal-muted mt-1.5">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
