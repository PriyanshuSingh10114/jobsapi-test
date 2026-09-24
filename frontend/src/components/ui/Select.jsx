import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({
  label,
  options = [],
  value,
  onChange,
  error,
  placeholder = 'Select option...',
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-charcoal mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={onChange}
          className={`w-full appearance-none text-sm bg-surface border rounded-lg pl-3 pr-8 py-2 text-charcoal transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:opacity-50 disabled:bg-surface-soft cursor-pointer ${
            error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-border-warm'
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lbl = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
        <ChevronDown className="absolute right-2.5 w-4 h-4 text-charcoal-muted pointer-events-none" />
      </div>
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
