import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'default',
  ...props
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    default: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`card-warm ${hover ? 'hover:shadow-warm-md hover:border-border-warm cursor-pointer' : ''} ${paddings[padding] || paddings.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  title,
  subtitle,
  action,
  className = '',
  children
}) => {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      {children ? children : (
        <div>
          {title && <h3 className="text-base font-semibold text-charcoal tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-charcoal-muted mt-0.5">{subtitle}</p>}
        </div>
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
