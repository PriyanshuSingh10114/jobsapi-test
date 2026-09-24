import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search jobs, companies, skills...',
  size = 'md',
  shortcut = false,
  className = '',
  autoFocus = false,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setInternalValue(val);
    if (onChange) onChange(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(internalValue);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    if (onChange) onChange('');
    if (onSearch) onSearch('');
  };

  const sizes = {
    sm: 'text-xs py-1.5 pl-8 pr-8 rounded-lg',
    md: 'text-sm py-2.5 pl-9 pr-10 rounded-xl',
    lg: 'text-base py-3.5 pl-11 pr-12 rounded-2xl shadow-warm-sm',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2.5',
    md: 'w-4 h-4 left-3',
    lg: 'w-5 h-5 left-4',
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className={`absolute text-charcoal-muted pointer-events-none transition-colors ${iconSizes[size] || iconSizes.md}`} />
      
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full bg-surface border border-border-warm text-charcoal placeholder:text-charcoal-muted/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary ${sizes[size] || sizes.md}`}
        {...props}
      />

      {internalValue ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-1 text-charcoal-muted hover:text-charcoal hover:bg-surface-soft rounded-full transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcut ? (
        <div className="absolute right-3 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-charcoal-muted bg-surface-soft border border-border-warm rounded">
          <span>⌘</span>
          <span>K</span>
        </div>
      ) : null}
    </div>
  );
};
